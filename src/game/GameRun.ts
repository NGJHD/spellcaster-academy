/**
 * One playthrough of Level 1. Plain TypeScript: the R3F driver calls `update` each frame and
 * forwards key intents; the HUD reads coarse state from the run store.
 */
import { Vector3 } from 'three';
import { audio } from '../audio/AudioManager';
import { voice } from '../audio/voice';
import { RESUME_SUMMARY, getLine, type DialogueLine } from '../content/dialogue';
import { strings } from '../content/strings';
import { FROST_SEC, isShielded, type TargetRuntime } from '../enemies/EnemyBrain';
import { EncounterRunner, type EncounterEvent } from '../level/encounters/EncounterRunner';
import { LevelDirector } from '../level/LevelDirector';
import { LEVEL1_ENCOUNTERS, LEVEL1_ROUTE } from '../level/level1Route';
import type { BarkTrigger, EncounterDef, LevelBeat, MusicId, Reward, TargetSpawn } from '../level/levelTypes';
import { isCameraBeat, type RailSettings } from '../level/rail/railTypes';
import { patchRunUi, useRunStore, type LabelInfo } from '../state/runStore';
import type { KeyIntent } from '../typing/keys';
import { TypingEngine, type TypingEvent } from '../typing/TypingEngine';
import { TypingMetricsRecorder, averageWpm, cloneMetrics, type PersistedRunMetrics } from '../typing/TypingMetrics';
import { DIFFICULTY } from './difficulty';
import {
  mergeBestResults,
  newAutosave,
  readProfile,
  writeAutosave,
  writeProfile,
  type KeyValueStorage,
  type Level1Autosave,
} from './saveData';
import { buildResults, wordScore, type ResultsData } from './scoring';
import type { AreaId, CosmeticId, Difficulty, SpellId, StarPageId } from './types';
import { ALL_STAR_PAGES } from './types';

export const MAX_FOCUS = 100;
export const FOCUS_RESET_SEC = 1.8;
export const RESUME_INTRO_SEC = 1.5;
export const SAVE_DEBOUNCE_SEC = 0.4;
/** Chain Spark fires on every Nth consecutive perfect word. */
export const CHAIN_STREAK = 5;
export const CHAIN_TARGETS = 2;
const SHAKE_SEC = 0.35;

export interface RunSettings {
  readonly rail: RailSettings;
}

export interface RunOptions {
  readonly difficulty: Difficulty;
  readonly resume: Level1Autosave | null;
  readonly storage: KeyValueStorage;
  /** An older run's save is kept until this run reaches its first checkpoint (LD-5). */
  readonly deferSavesUntilFirstCheckpoint: boolean;
  readonly settings: () => RunSettings;
  readonly onResults?: (results: ResultsData) => void;
  readonly now?: () => number;
  /** Development/testing only: begin a new run at this beat. */
  readonly startBeatId?: string;
}

export interface SpellEvent {
  readonly key: number;
  readonly kind: 'bolt' | 'frost' | 'chain';
  readonly to: Vector3;
  readonly targetId: string;
  readonly shieldBreak: boolean;
}

export interface RetiredTarget {
  readonly id: string;
  readonly spawn: TargetSpawn;
  readonly position: Vector3;
}

interface DialogueState {
  readonly beatId: string;
  readonly lines: readonly DialogueLine[];
  index: number;
  elapsed: number;
  /** False while a remark from the previous moment finishes. */
  started: boolean;
  /**
   * Line index at which the camera is released to carry on while the rest of the lines play as
   * subtitles (owner feedback: no standing still). -1 keeps the beat until the last line ends.
   */
  readonly releaseAt: number;
}

/** A released conversation lets the camera go once its line has been up this long. */
const RELEASE_AFTER_SEC = 1.2;

interface ChoiceState {
  readonly beatId: string;
  index: number;
  panel: 'none' | 'controls' | 'difficulty';
  difficultyIndex: number;
}

const DIFFICULTY_ORDER: readonly Difficulty[] = ['gentle', 'standard', 'challenge'];

/** How long a line stays up when it is not being spoken (brisk, but readable for a child). */
export function readSeconds(text: string): number {
  return 1.1 + text.length * 0.045;
}

let keyCounter = 1;
const nextKey = () => keyCounter++;

/** A spark gem swoops in after this long with nothing to type (CLAUDE.md §1B 7-second rule, at Fast). */
const GEM_AFTER_IDLE_SEC = 1.8;
/** An ignored gem flies off after this long. */
const GEM_LIFETIME_SEC = 5;
/** Score for catching a gem (before the combo multiplier). */
const GEM_SCORE = 40;

/** A bonus word stays typeable at least this long before the camera may move on. */
const BONUS_MIN_VISIBLE_SEC = 3;

/** Seconds after a battle before the story music returns. */
const MUSIC_REVERT_SEC = 3;

const BATTLE_MUSIC: Partial<Record<AreaId, MusicId>> = {
  'sunlit-courtyard': 'courtyard-action',
  'whispering-library': 'grimoire-battle',
  'enchanted-greenhouse': 'greenhouse-action',
  'lower-stairwell': 'tower-battle',
  'practice-gallery': 'courtyard-action',
  'moon-tower': 'tower-battle',
  observatory: 'warden-defence',
};

/** Story music when resuming mid-area before any beat has named a mood. */
const AREA_MUSIC: Record<AreaId, MusicId> = {
  'arrival-gate': 'arrival-wonder',
  'sunlit-courtyard': 'arrival-wonder',
  'east-hall': 'east-hall-calm',
  'whispering-library': 'library-mystery',
  'hall-of-portraits': 'portrait-rest',
  'enchanted-greenhouse': 'greenhouse-wonder',
  'lower-stairwell': 'tower-ascent',
  'practice-gallery': 'east-hall-calm',
  'moon-tower': 'tower-ascent',
  observatory: 'tower-ascent',
  'celebration-courtyard': 'celebration',
};

const CALM_FOR_ACTION: Partial<Record<MusicId, MusicId>> = {
  'courtyard-action': 'arrival-wonder',
  'grimoire-battle': 'library-mystery',
  'greenhouse-action': 'greenhouse-wonder',
  'warden-defence': 'tower-ascent',
  'tower-battle': 'tower-ascent',
};

/** Time-critical encounters: something in them can lower HP. */
function isDangerous(def: EncounterDef): boolean {
  return def.kind === 'combat' && (def.hazard !== undefined || def.waves.some((w) => w.targets.some((t) => t.attack !== undefined)));
}

export class GameRun {
  readonly director: LevelDirector;
  readonly typing: TypingEngine;
  readonly metrics: TypingMetricsRecorder;
  readonly progress: Level1Autosave;
  readonly flags: Set<string>;
  readonly retired: RetiredTarget[] = [];
  readonly spellEvents: SpellEvent[] = [];
  encounter: EncounterRunner | null = null;
  private encounterBeatId: string | null = null;
  bonus: EncounterRunner | null = null;
  focus = MAX_FOCUS;
  shakeTime = 0;
  /** Screen-centre distance of a target; supplied by the renderer each frame. */
  centralityOf: (targetId: string) => number = () => 0;

  private committed: PersistedRunMetrics;
  private areaId: AreaId;
  private dialogue: DialogueState | null = null;
  private choice: ChoiceState | null = null;
  private barkQueue: DialogueLine[] = [];
  private currentBark: DialogueLine | null = null;
  private resumeIntro = 0;
  private pendingStartBeat: string | undefined;
  private pendingStartWave = 0;
  private focusResetTimer = 0;
  private paused = false;
  private ended = false;
  private savesEnabled: boolean;
  private saveIn = -1;
  private attempt = 0;
  private failures = new Map<string, number>();
  private firedBarks = new Set<string>();
  private encounterFirstCorrect = false;
  private encounterFirstMistake = false;
  private pendingMultiplier = 1;
  private activeMultiplier = 1;
  private newCosmetics: CosmeticId[] = [];
  private readonly now: () => number;

  constructor(private readonly options: RunOptions) {
    this.now = options.now ?? (() => performance.now());
    const firstBeat = LEVEL1_ROUTE.beats[0]?.id ?? '';
    const resume = options.resume;
    this.progress = resume
      ? { ...resume, metrics: cloneMetrics(resume.metrics) }
      : newAutosave(`run-${Date.now().toString(36)}`, options.difficulty, firstBeat);
    this.committed = cloneMetrics(this.progress.metrics);
    this.flags = new Set(this.progress.flags);
    this.pendingMultiplier = this.progress.pendingScoreMultiplier;
    this.areaId = this.progress.areaId;
    this.savesEnabled = !options.deferSavesUntilFirstCheckpoint;
    this.metrics = new TypingMetricsRecorder(this.progress.metrics, this.areaId);
    this.typing = new TypingEngine({
      rejectMistakes: DIFFICULTY[this.progress.difficulty].rejectMistakes,
      centralityOf: (id) => this.centralityOf(id),
    });
    this.director = new LevelDirector(LEVEL1_ROUTE, {
      onBeatStart: (beat) => this.onBeatStart(beat),
      onBeatEnd: (beat) => this.onBeatEnd(beat),
    });

    patchRunUi({
      focus: this.focus,
      unlimitedHp: DIFFICULTY[this.difficulty].unlimitedHp,
      starPages: this.progress.collectedStarPageIds.length,
      streak: this.progress.metrics.currentStreak,
      results: null,
    });

    if (resume) {
      // LD-5: resume at the last committed beat after a short, safe establishing moment.
      this.pendingStartBeat = resume.resumeBeatId;
      this.pendingStartWave = resume.resumeWaveIndex;
      this.resumeIntro = RESUME_INTRO_SEC;
      this.director.previewPose(resume.resumeBeatId, this.director.pose);
      patchRunUi({ resumeIntro: true, areaId: this.areaId, areaCardKey: nextKey() });
    } else {
      this.director.start(this.settings().rail, options.startBeatId);
    }
  }

  get difficulty(): Difficulty {
    return this.progress.difficulty;
  }

  get assist(): boolean {
    return this.progress.assist;
  }

  get isEncounterActive(): boolean {
    return this.encounter !== null && this.encounter.state !== 'complete';
  }

  get currentAreaId(): AreaId {
    return this.areaId;
  }

  get hasSpell(): (id: SpellId) => boolean {
    return (id) => this.progress.unlockedSpells.includes(id);
  }

  get trail(): CosmeticId | null {
    return readProfile(this.options.storage).selectedTrail;
  }

  private settings(): RunSettings {
    return this.options.settings();
  }

  /** Target the camera should gently frame (the locked target), if any. */
  framingTarget(out: Vector3): boolean {
    const id = this.typing.lockedId;
    if (!id) return false;
    const t = this.findTarget(id);
    if (!t) return false;
    out.copy(t.position);
    out.y += (t.spawn.labelHeight ?? 1) * 0.5;
    return true;
  }

  allTargets(): IterableIterator<TargetRuntime> {
    const a = this.encounter?.targets.values() ?? [][Symbol.iterator]();
    const b = this.bonus?.targets.values() ?? [][Symbol.iterator]();
    const g = this.gem?.targets.values() ?? [][Symbol.iterator]();
    function* both() {
      yield* a;
      yield* b;
      yield* g;
    }
    return both();
  }

  /** Progress of an encounter for scene props: live while running, full once completed. */
  encounterProgress(encounterId: string): { done: number; total: number; complete: boolean } {
    const def = LEVEL1_ENCOUNTERS.get(encounterId);
    const total = def ? def.waves.reduce((n, w) => n + w.targets.filter((t) => !t.optional).length, 0) : 0;
    if (this.progress.completedEncounterIds.includes(encounterId)) return { done: total, total, complete: true };
    if (this.encounter?.def.id === encounterId) {
      const before = this.encounter.def.waves
        .slice(0, this.encounter.waveIndex)
        .reduce((n, w) => n + w.targets.filter((t) => !t.optional).length, 0);
      return { done: before + this.encounter.waveProgress.done, total, complete: false };
    }
    return { done: 0, total, complete: false };
  }

  isRetired(targetId: string): boolean {
    return this.retired.some((r) => r.id === targetId);
  }

  findTarget(id: string): TargetRuntime | undefined {
    return this.encounter?.targets.get(id) ?? this.bonus?.targets.get(id) ?? this.gem?.targets.get(id);
  }

  // ---------- Frame update ----------

  update(dtSec: number): void {
    if (this.ended || this.paused) return;
    const dt = Math.min(dtSec, 0.1);
    const settings = this.settings();
    this.progress.metrics.levelTimeMs += dt * 1000;
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.updateSaveTimer(dt);
    this.updateBarks(dt);
    this.updateMusic(dt);

    if (this.resumeIntro > 0) {
      this.resumeIntro -= dt;
      if (this.resumeIntro <= 0) {
        patchRunUi({ resumeIntro: false });
        const summary = RESUME_SUMMARY[this.areaId];
        this.queueBark(summary);
        const beatId = this.pendingStartBeat;
        this.pendingStartBeat = undefined;
        this.director.start(settings.rail, beatId);
      }
      return;
    }

    if (this.focusResetTimer > 0) {
      this.focusResetTimer -= dt;
      if (this.focusResetTimer <= 0) this.finishFocusReset();
      return;
    }

    if (this.dialogue) this.updateDialogue(dt);

    // Never carry the camera away from a bonus word too soon or once the player has started it
    // (owner bugs: "gle" for "glint", then "glint is skipped entirely" after the pace-up). The camera
    // finishes its move, then waits at the end pose.
    let railDt = dt;
    if (this.bonusNeedsTime()) railDt = Math.min(dt, Math.max(0, this.director.remainingSec(settings.rail) - 1e-4));
    this.director.update(railDt, settings.rail);

    const timeScale = this.typing.isMidWord ? DIFFICULTY[this.difficulty].typingTimeScale : 1;
    const locked = this.typing.lockedId;
    let changed = false;
    if (this.encounter) {
      const events = this.encounter.update(dt, timeScale, locked);
      if (events.length > 0) changed = true;
      this.handleEncounterEvents(events);
    }
    if (this.bonus) {
      const events = this.bonus.update(dt, timeScale, locked);
      if (events.length > 0) changed = true;
      this.handleBonusEvents(events);
    }
    if (this.updateGems(dt, timeScale, locked)) changed = true;
    if (changed) this.refreshTargets();
  }

  // ---------- Spark gems (CLAUDE.md §1B: never more than ~7 s at Fast with nothing to type) ----------

  gem: EncounterRunner | null = null;
  private idleSec = 0;
  private gemCount = 0;
  private readonly gemForward = new Vector3();
  private readonly gemRight = new Vector3();
  private readonly gemGoal = new Vector3();

  /** Spawns a gem after a short lull and keeps live gems flying beside the camera. Returns true if targets changed. */
  private updateGems(dt: number, timeScale: number, locked: string | null): boolean {
    let changed = false;
    const prompt = locked !== null || this.candidateCount() > 0 || this.choice !== null;
    this.idleSec = prompt ? 0 : this.idleSec + dt;
    if (!this.gem && this.idleSec >= GEM_AFTER_IDLE_SEC && this.gemsAllowed()) {
      this.spawnGem();
      changed = true;
    }
    const gem = this.gem;
    if (!gem) return changed;
    const pose = this.director.pose;
    const fwd = this.gemForward.copy(pose.lookAt).sub(pose.position).normalize();
    const right = this.gemRight.set(-fwd.z, 0, fwd.x).normalize();
    const k = 1 - Math.exp(-5 * dt);
    for (const t of gem.targets.values()) {
      const side = Number(t.spawn.variant ?? '1');
      this.gemGoal
        .copy(pose.position)
        .addScaledVector(fwd, 4.2)
        .addScaledVector(right, side * 1.25);
      this.gemGoal.y += 0.15 + Math.sin(t.clock * 2.2) * 0.08;
      t.position.lerp(this.gemGoal, k);
    }
    const events = gem.update(dt, timeScale, locked);
    for (const e of events) {
      if (e.type === 'complete') {
        this.gem = null;
        this.idleSec = 0;
        return true;
      }
    }
    return changed || events.length > 0;
  }

  private gemsAllowed(): boolean {
    if (this.ended || this.focusResetTimer > 0 || this.resumeIntro > 0) return false;
    const beat = this.director.currentBeat;
    if (!beat || beat.kind === 'results' || beat.attention) return false;
    if (this.encounter && this.encounter.state !== 'complete' && this.encounter.def.kind === 'combat') return false;
    return this.director.pose.fade < 0.2;
  }

  private spawnGem(): void {
    const n = ++this.gemCount;
    const side = n % 2 === 0 ? 1 : -1;
    const pose = this.director.pose;
    const fwd = this.gemForward.copy(pose.lookAt).sub(pose.position).normalize();
    const right = this.gemRight.set(-fwd.z, 0, fwd.x).normalize();
    // Swoop in from well ahead and to the side, then settle beside the camera.
    const start = pose.position.clone().addScaledVector(fwd, 12).addScaledVector(right, side * 4).add(new Vector3(0, 1.5, 0));
    const spawn: TargetSpawn = {
      id: `gem-${n}`,
      kind: 'gem',
      position: [start.x, start.y, start.z],
      words: [{ min: 3, max: 4 }],
      optional: true,
      leaveAfterSec: GEM_LIFETIME_SEC,
      labelHeight: 0.28,
      variant: String(side),
    };
    const def: EncounterDef = { id: `gem:${n}`, areaId: this.areaId, kind: 'interaction', waves: [{ id: 'gem', targets: [spawn] }] };
    this.gem = new EncounterRunner(def, { difficulty: this.difficulty, assist: this.assist, attempt: n });
  }

  setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) {
      this.metrics.suspend();
      this.saveNow();
    }
  }

  /** Browser hidden / page closing. */
  suspend(): void {
    this.metrics.suspend();
    this.saveNow();
  }

  // ---------- Input ----------

  handleIntent(intent: KeyIntent): void {
    if (this.ended || this.paused || this.resumeIntro > 0 || this.focusResetTimer > 0) return;

    if (this.choice) {
      this.handleChoiceIntent(intent);
      return;
    }
    if (this.dialogue) {
      const skip = intent.kind === 'enter' || intent.kind === 'space' || intent.kind === 'letter';
      if (skip && !this.dialogue.started) {
        // Skip the remark still finishing and go straight to the conversation.
        voice.cancel();
        this.currentBark = null;
        this.startDialogue();
      } else if (skip) {
        // Enter/Space always skip at once; a letter is guarded briefly in case it was held over.
        this.advanceDialogue(true, intent.kind === 'letter');
      }
      // Letters, Backspace and Tab also reach typing: gems fly in during conversations, so there is
      // always something to do, and a typo on one must be fixable mid-line.
      const typingKey = intent.kind === 'letter' || intent.kind === 'backspace' || intent.kind === 'tab';
      if (!typingKey || (this.typing.lockedId === null && this.candidateCount() === 0)) return;
    }
    if (intent.kind === 'letter') this.dismissBarks();
    // Enter or Space while a line is still being said skips to the next line (owner feedback).
    if ((intent.kind === 'enter' || intent.kind === 'space') && this.currentBark) {
      this.skipBark();
      return;
    }
    if (intent.kind === 'enter' && this.encounter?.def.optionalPrompt && this.encounter.state !== 'complete') {
      this.skipOptionalEncounter();
      return;
    }

    const hasTargets = this.typing.lockedId !== null || this.candidateCount() > 0;
    if (!hasTargets) return;
    const nowMs = this.now();
    let events: TypingEvent[];
    switch (intent.kind) {
      case 'letter':
        events = this.typing.typeLetter(intent.char);
        break;
      case 'backspace':
        events = this.typing.backspace();
        break;
      case 'tab':
        events = this.typing.cycle(intent.reverse);
        break;
      default:
        return;
    }
    this.handleTypingEvents(events, nowMs);
    this.refreshLabels();
  }

  private candidateCount(): number {
    return (this.encounter?.candidates().length ?? 0) + (this.bonus?.candidates().length ?? 0) + (this.gem?.candidates().length ?? 0);
  }

  private handleTypingEvents(events: readonly TypingEvent[], nowMs: number): void {
    for (const e of events) {
      switch (e.type) {
        case 'correct':
          this.metrics.recordEntry(true, e.targetId, nowMs);
          audio.playSfx('key-correct', { rate: 0.94 + Math.random() * 0.12 });
          if (!this.encounterFirstCorrect && this.encounter && e.targetId && this.encounter.targets.has(e.targetId)) {
            this.encounterFirstCorrect = true;
            this.fireBarks({ on: 'first-correct' });
          }
          break;
        case 'incorrect':
          this.metrics.recordEntry(false, e.targetId, nowMs);
          audio.playSfx('key-incorrect');
          patchRunUi({ mistakeKey: nextKey(), mistakeTargetId: e.targetId });
          if (!this.encounterFirstMistake && this.encounter) {
            this.encounterFirstMistake = true;
            this.fireBarks({ on: 'first-mistake' });
          }
          break;
        case 'corrected':
          this.metrics.recordCorrected();
          break;
        case 'unlock':
          this.metrics.closeAttempt();
          break;
        case 'complete':
          this.onWordComplete(e.targetId, e.word, e.mistakes, nowMs);
          break;
        default:
          break;
      }
    }
  }

  private onWordComplete(targetId: string, word: string, mistakes: number, nowMs: number): void {
    const runner = this.encounter?.targets.has(targetId) ? this.encounter : this.gem?.targets.has(targetId) ? this.gem : this.bonus;
    const target = runner?.targets.get(targetId);
    if (!runner || !target) return;
    this.metrics.recordCompletion(targetId, word, mistakes, nowMs);
    const perfect = mistakes === 0;
    const m = this.progress.metrics;
    m.score += wordScore(word.length, perfect, this.activeMultiplier);

    const shieldBreak = isShielded(target);
    const frost = perfect && this.progress.unlockedSpells.includes('frost-thread');
    this.spellEvents.push({
      key: nextKey(),
      kind: frost ? 'frost' : 'bolt',
      to: target.position.clone(),
      targetId,
      shieldBreak,
    });
    audio.playSfx('spell-cast');
    if (perfect) audio.playSfx('perfect-word');
    if (shieldBreak) audio.playSfx('shield-break');

    const result = runner.completeWord(targetId, mistakes);

    if (frost) {
      audio.playSfx('frost');
      for (const other of this.allTargets()) if (other.id !== targetId && !other.defeated) other.frostTimer = FROST_SEC;
    }

    if (
      perfect &&
      this.progress.unlockedSpells.includes('chain-spark') &&
      m.currentStreak > 0 &&
      m.currentStreak % CHAIN_STREAK === 0 &&
      runner === this.encounter
    ) {
      this.castChainSpark(targetId);
    }

    if (result.defeated && runner === this.gem) {
      // Spark gem caught: a bright chime and bonus score, no other rewards.
      m.score += GEM_SCORE * this.activeMultiplier;
      audio.playSfx('star-page', { rate: 1.25, volume: 0.7 });
    } else if (result.defeated) {
      audio.playSfx('dispel');
      const spawn = target.spawn;
      if (spawn.optional) m.optionalTargetsCompleted++;
      const qualifies =
        spawn.rewardIf === undefined ||
        (spawn.rewardIf === 'first-defeat' && result.firstDefeat) ||
        (spawn.rewardIf === 'perfect' && perfect);
      if (spawn.reward && qualifies) this.grantReward(spawn.reward);
      if (runner === this.encounter) this.fireBarks({ on: 'defeats', count: runner.totalDefeats });
    }
    patchRunUi({ streak: m.currentStreak, liveWpm: averageWpm(m) });
    this.refreshTargets();
  }

  private castChainSpark(sourceId: string): void {
    const runner = this.encounter;
    if (!runner) return;
    const victims = [...runner.targets.values()]
      .filter((t) => t.id !== sourceId && !t.defeated && t.phase === 'active' && t.spawn.weak)
      .slice(0, CHAIN_TARGETS);
    audio.playSfx('chain-spark');
    for (const v of victims) {
      if (runner.dispel(v.id)) {
        this.spellEvents.push({ key: nextKey(), kind: 'chain', to: v.position.clone(), targetId: v.id, shieldBreak: false });
        this.progress.metrics.score += 25;
      }
    }
    if (!this.flags.has('seen-chain')) {
      this.flags.add('seen-chain');
      this.queueBark(getLine('spell-chain'));
    }
  }

  // ---------- Music ----------

  /** Story music for the current beat; action moods authored on story beats play as their calm counterpart. */
  private storyMusic: MusicId | null = null;
  private battleMusic: MusicId | null = null;
  private musicRevertIn = -1;

  private setStoryMusic(id: MusicId): void {
    this.storyMusic = CALM_FOR_ACTION[id] ?? id;
    if (!this.battleMusic) audio.setMusic(this.storyMusic);
  }

  /** Owner feedback: the music changes whenever creatures can hurt the player. */
  private setBattleMusic(id: MusicId): void {
    this.musicRevertIn = -1;
    if (this.battleMusic === id) return;
    this.battleMusic = id;
    audio.setMusic(id);
  }

  private updateMusic(dt: number): void {
    if (this.musicRevertIn < 0) return;
    this.musicRevertIn -= dt;
    // A short grace period keeps battle music going across quick boss-phase dialogue.
    if (this.musicRevertIn < 0) {
      this.battleMusic = null;
      audio.setMusic(this.storyMusic ?? AREA_MUSIC[this.areaId]);
    }
  }

  // ---------- Beats ----------

  private onBeatStart(beat: LevelBeat): void {
    if (beat.areaId !== this.areaId) this.enterArea(beat.areaId);
    const beatIndex = LEVEL1_ROUTE.beats.indexOf(beat);
    patchRunUi({ beatId: beat.id, progress: Math.max(0, beatIndex) / Math.max(1, LEVEL1_ROUTE.beats.length - 1) });
    if (beat.music) this.setStoryMusic(beat.music);
    if (beat.objective !== undefined) patchRunUi({ objective: beat.objective === 'none' ? null : beat.objective });
    for (const id of beat.barks ?? []) this.queueBark(getLine(id));
    if (beat.restoreFocus) this.setFocus(MAX_FOCUS);
    if (beat.bonus) this.startBonus(beat);

    // Every beat start is a stable resume point (LD-6).
    this.progress.resumeBeatId = beat.id;
    this.progress.resumeWaveIndex = 0;
    this.progress.areaId = beat.areaId;

    switch (beat.kind) {
      case 'dialogue': {
        // Lines still waiting from the previous moment come first, so no story line is lost.
        const lines = [...this.barkQueue, ...beat.lines.map((id) => getLine(id)).filter((l): l is DialogueLine => !!l)];
        this.barkQueue = [];
        this.dialogue = { beatId: beat.id, lines, index: 0, elapsed: 0, started: false, releaseAt: this.releaseIndex(lines.length) };
        if (!this.currentBark) this.startDialogue();
        break;
      }
      case 'encounter':
        this.startEncounter(beat.id, beat.encounterId);
        break;
      case 'checkpoint':
        this.commitCheckpoint(beat);
        this.director.completeGatedBeat(beat.id);
        break;
      case 'choice':
        this.choice = { beatId: beat.id, index: 0, panel: 'none', difficultyIndex: DIFFICULTY_ORDER.indexOf(this.difficulty) };
        this.publishChoice();
        break;
      case 'results':
        this.finishLevel();
        break;
      default:
        break;
    }
    this.requestSave();
  }

  private onBeatEnd(beat: LevelBeat): void {
    if (this.bonus && isCameraBeat(beat) && beat.bonus) {
      // Bonus windows close with their camera beat; missed pages never block progress.
      for (const t of this.bonus.targets.values()) if (!t.defeated) t.phase = 'gone';
      this.bonus = null;
      this.typing.setCandidates(this.encounter?.candidates() ?? []);
      this.refreshTargets();
    }
  }

  private enterArea(areaId: AreaId): void {
    this.areaId = areaId;
    this.metrics.setArea(areaId);
    this.retired.length = 0;
    patchRunUi({ areaId, areaCardKey: nextKey(), retiredKey: nextKey() });
  }

  /** True while a bonus word must stay reachable: locked mid-word, or not yet shown long enough. */
  private bonusNeedsTime(): boolean {
    const bonus = this.bonus;
    if (!bonus) return false;
    if (this.typing.lockedId !== null && bonus.targets.has(this.typing.lockedId)) return true;
    for (const t of bonus.targets.values()) {
      if (t.defeated || t.phase === 'leaving' || t.phase === 'gone') continue;
      if (t.phase !== 'active' || t.activeTime < BONUS_MIN_VISIBLE_SEC) return true;
    }
    return false;
  }

  private startBonus(beat: LevelBeat): void {
    const spawn = beat.bonus;
    if (!spawn) return;
    if (spawn.reward?.starPage && this.progress.collectedStarPageIds.includes(spawn.reward.starPage)) return;
    if (spawn.reward?.cosmetic && this.progress.unlockedCosmeticIds.includes(spawn.reward.cosmetic)) return;
    const def: EncounterDef = {
      id: `bonus:${beat.id}`,
      areaId: beat.areaId,
      kind: 'interaction',
      waves: [{ id: 'bonus', targets: [spawn] }],
    };
    this.bonus = new EncounterRunner(def, { difficulty: this.difficulty, assist: this.assist, attempt: 0 });
  }

  private startEncounter(beatId: string, encounterId: string): void {
    const def = LEVEL1_ENCOUNTERS.get(encounterId);
    if (!def) {
      this.director.completeGatedBeat(beatId);
      return;
    }
    const startWave = this.pendingStartWave;
    this.pendingStartWave = 0;
    this.attempt++;
    this.encounter = new EncounterRunner(def, { difficulty: this.difficulty, assist: this.assist, attempt: this.attempt }, startWave);
    this.encounterBeatId = beatId;
    this.firedBarks.clear();
    this.encounterFirstCorrect = false;
    this.encounterFirstMistake = false;
    this.progress.resumeWaveIndex = startWave;
    if (def.kind === 'combat') {
      this.activeMultiplier = this.pendingMultiplier;
      this.pendingMultiplier = 1;
      this.progress.pendingScoreMultiplier = 1;
    } else {
      this.activeMultiplier = 1;
    }
    if (def.bossPhase) audio.playSfx('boss-phase');
    if (isDangerous(def)) this.setBattleMusic(BATTLE_MUSIC[this.areaId] ?? 'courtyard-action');
    patchRunUi({ prompt: def.optionalPrompt ?? null });
    this.resetEncounterTyping();
  }

  private handleEncounterEvents(events: readonly EncounterEvent[]): void {
    const runner = this.encounter;
    if (!runner) return;
    for (const e of events) {
      switch (e.type) {
        case 'wave-start':
          this.progress.resumeWaveIndex = e.wave;
          this.fireBarks({ on: 'wave-start', wave: e.wave });
          this.requestSave();
          break;
        case 'wave-complete':
          // Commit metrics atomically with the wave (LD-20).
          this.commitMetrics();
          this.progress.resumeWaveIndex = e.wave + 1;
          this.requestSave();
          break;
        case 'complete':
          this.completeEncounter(runner);
          return;
        case 'hit':
          this.applyDamage(e.damage);
          break;
        case 'hazard-hit':
          this.applyDamage(e.damage);
          patchRunUi({ hazard: null });
          break;
        case 'hazard-windup':
          audio.playSfx('enemy-telegraph');
          patchRunUi({ hazard: { key: nextKey(), attack: e.attack, windupSec: e.windupSec } });
          break;
        case 'windup':
          audio.playSfx('enemy-telegraph', { volume: 0.6 });
          break;
        case 'target-gone':
          if (e.target.spawn.persist && e.target.defeated) {
            this.retired.push({ id: e.target.id, spawn: e.target.spawn, position: e.target.position.clone() });
            patchRunUi({ retiredKey: nextKey() });
          }
          break;
        case 'assist-enabled':
          this.progress.assist = true;
          this.queueBark(getLine('gal-assist'));
          break;
        default:
          break;
      }
    }
  }

  private handleBonusEvents(events: readonly EncounterEvent[]): void {
    for (const e of events) {
      if (e.type === 'complete') {
        this.bonus = null;
        this.refreshTargets();
        return;
      }
    }
  }

  private completeEncounter(runner: EncounterRunner): void {
    const def = runner.def;
    const effects = def.onComplete;
    this.fireBarks({ on: 'complete' });
    if (effects) {
      for (const f of effects.flags ?? []) this.flags.add(f);
      if (effects.restoreAnchor && !this.progress.restoredAnchors.includes(effects.restoreAnchor)) {
        this.progress.restoredAnchors.push(effects.restoreAnchor);
        audio.playSfx('checkpoint');
      }
      if (effects.unlockSpell) this.unlockSpell(effects.unlockSpell);
      if (effects.restoreFocus) this.setFocus(MAX_FOCUS);
      if (effects.nextScoreMultiplier) {
        this.pendingMultiplier = effects.nextScoreMultiplier;
        this.progress.pendingScoreMultiplier = effects.nextScoreMultiplier;
      }
      if (effects.reward) this.grantReward(effects.reward);
    }
    for (const f of this.flags) if (!this.progress.flags.includes(f)) this.progress.flags.push(f);
    if (!this.progress.completedEncounterIds.includes(def.id)) this.progress.completedEncounterIds.push(def.id);
    if (def.bossPhase && !this.progress.completedBossPhases.includes(def.bossPhase)) {
      this.progress.completedBossPhases.push(def.bossPhase);
    }
    this.activeMultiplier = 1;
    this.commitMetrics();
    if (this.battleMusic) this.musicRevertIn = MUSIC_REVERT_SEC;
    const beatId = this.encounterBeatId;
    this.encounter = null;
    this.encounterBeatId = null;
    this.resetEncounterTyping();
    patchRunUi({ prompt: null, hazard: null });
    this.refreshTargets();
    // Resume after a completed encounter from the beat that follows it.
    const next = LEVEL1_ROUTE.beats[this.director.currentIndex + 1];
    if (next) {
      this.progress.resumeBeatId = next.id;
      this.progress.resumeWaveIndex = 0;
    }
    this.saveNow();
    if (beatId) this.director.completeGatedBeat(beatId);
  }

  private skipOptionalEncounter(): void {
    const runner = this.encounter;
    if (!runner) return;
    runner.skip();
    const beatId = this.encounterBeatId;
    this.encounter = null;
    this.encounterBeatId = null;
    this.resetEncounterTyping();
    patchRunUi({ prompt: null });
    this.refreshTargets();
    audio.playSfx('ui-select');
    if (beatId) this.director.completeGatedBeat(beatId);
  }

  private unlockSpell(spell: SpellId): void {
    if (this.progress.unlockedSpells.includes(spell)) return;
    this.progress.unlockedSpells.push(spell);
    audio.playSfx('unlock');
    patchRunUi({ toast: { key: nextKey(), title: strings.toasts.spellUnlocked, detail: strings.spells[spell] } });
  }

  private grantReward(reward: Reward): void {
    const m = this.progress.metrics;
    if (reward.score) m.score += reward.score;
    if (reward.starPage) this.collectStarPage(reward.starPage);
    if (reward.cosmetic) this.unlockCosmetic(reward.cosmetic);
  }

  private collectStarPage(page: StarPageId): void {
    if (this.progress.collectedStarPageIds.includes(page)) return;
    this.progress.collectedStarPageIds.push(page);
    const count = this.progress.collectedStarPageIds.length;
    audio.playSfx('star-page');
    patchRunUi({
      starPages: count,
      toast: { key: nextKey(), title: strings.toasts.starPage, detail: `${count} / ${ALL_STAR_PAGES.length}` },
    });
    this.saveNow();
  }

  private unlockCosmetic(id: CosmeticId): void {
    if (!this.progress.unlockedCosmeticIds.includes(id)) this.progress.unlockedCosmeticIds.push(id);
    const profile = readProfile(this.options.storage);
    if (!profile.cosmetics.includes(id)) {
      profile.cosmetics.push(id);
      this.newCosmetics.push(id);
    }
    profile.selectedTrail = id;
    writeProfile(this.options.storage, profile);
    audio.playSfx('unlock');
    patchRunUi({ toast: { key: nextKey(), title: strings.toasts.cosmetic, detail: strings.cosmetics[id] } });
    this.saveNow();
  }

  private commitCheckpoint(beat: Extract<LevelBeat, { kind: 'checkpoint' }>): void {
    this.progress.checkpointId = beat.checkpointId;
    if (beat.restoreFocus) this.setFocus(MAX_FOCUS);
    if (!this.savesEnabled) this.savesEnabled = true;
    this.commitMetrics();
    const next = LEVEL1_ROUTE.beats[this.director.currentIndex + 1];
    if (next) this.progress.resumeBeatId = next.id;
    if (beat.checkpointId === 'level-1-complete') this.progress.status = 'complete';
    audio.playSfx('checkpoint');
    this.saveNow();
  }

  // ---------- Focus ----------

  private setFocus(value: number): void {
    this.focus = Math.max(0, Math.min(MAX_FOCUS, value));
    patchRunUi({ focus: this.focus });
  }

  private applyDamage(damage: number): void {
    if (!this.encounter || this.encounter.def.kind !== 'combat') return;
    if (DIFFICULTY[this.difficulty].unlimitedHp) {
      // Gentle: the hit still reads (a soft glow), but nothing is lost.
      patchRunUi({ damageKey: nextKey() });
      return;
    }
    const before = this.focus;
    this.setFocus(this.focus - damage);
    this.progress.metrics.focusLost += before - this.focus;
    audio.playSfx('focus-hit');
    this.shakeTime = SHAKE_SEC;
    patchRunUi({ damageKey: nextKey() });
    this.fireBarks({ on: 'focus-below', value: this.focus });
    if (this.focus <= 0) this.beginFocusReset();
  }

  /**
   * Clears typing between encounters, but keeps a word the player is part-way through on a gem or
   * bonus target (they outlive encounters; dropping them turned correct letters into mistakes).
   */
  private resetEncounterTyping(): void {
    const locked = this.typing.lockedId;
    if (locked !== null && (this.gem?.targets.has(locked) || this.bonus?.targets.has(locked))) return;
    this.typing.reset();
  }

  private beginFocusReset(): void {
    this.focusResetTimer = FOCUS_RESET_SEC;
    this.typing.reset();
    this.metrics.closeAttempt();
    patchRunUi({ focusReset: true, labels: [], hazard: null });
  }

  private finishFocusReset(): void {
    const runner = this.encounter;
    this.setFocus(MAX_FOCUS);
    this.progress.metrics.checkpointRestarts++;
    patchRunUi({ focusReset: false });
    if (!runner) return;
    const id = runner.def.id;
    const failures = (this.failures.get(id) ?? 0) + 1;
    this.failures.set(id, failures);
    if (runner.def.assistAfterFailures && failures >= runner.def.assistAfterFailures && !this.progress.assist) {
      this.progress.assist = true;
      runner.ctx.assist = true;
      this.queueBark(getLine('assist-offer'));
    } else {
      this.queueBark(getLine('focus-reset'));
    }
    runner.restartWave();
    this.refreshTargets();
  }

  // ---------- Dialogue and barks ----------
  // Every line plays by itself (spoken when voice is on) and advances when finished; typing a letter
  // skips it. Story dialogue holds its beat only until its lines have played — never waits for Enter.

  private lineElapsed = 0;
  private lineSpeaking = false;

  private present(line: DialogueLine, blocking: boolean): void {
    patchRunUi({ subtitle: { key: nextKey(), speaker: line.speaker, text: line.text, blocking } });
    this.lineElapsed = 0;
    this.lineSpeaking = voice.speak(line.text, line.speaker, () => {
      this.lineSpeaking = false;
    });
  }

  private lineFinished(line: DialogueLine): boolean {
    if (this.lineSpeaking) return this.lineElapsed >= 2.5 + line.text.length * 0.1;
    return this.lineElapsed >= readSeconds(line.text);
  }

  /** Where a conversation lets the camera go: early before travel, at the last line before a fight. */
  private releaseIndex(lineCount: number): number {
    const i = this.director.currentIndex;
    const following = LEVEL1_ROUTE.beats.slice(i + 1, i + 4);
    if (lineCount === 0 || following.some((b) => b.kind === 'results' || b.kind === 'choice')) return -1;
    const next = following[0];
    if (!next) return -1;
    if (isCameraBeat(next)) return 0;
    if (next.kind === 'encounter') return lineCount - 1;
    return -1;
  }

  private startDialogue(): void {
    const d = this.dialogue;
    if (!d) return;
    d.started = true;
    this.showDialogueLine();
  }

  /** Let the director carry on; the current and remaining lines continue as subtitles. */
  private releaseDialogue(d: DialogueState): void {
    this.dialogue = null;
    this.currentBark = d.lines[d.index] ?? null;
    this.barkQueue = d.lines.slice(d.index + 1);
    const sub = useRunStore.getState().subtitle;
    if (sub) patchRunUi({ subtitle: { ...sub, blocking: false } });
    this.director.completeGatedBeat(d.beatId);
  }

  private showDialogueLine(): void {
    const d = this.dialogue;
    const line = d?.lines[d.index];
    if (!d || !line) return;
    this.present(line, true);
  }

  private updateDialogue(dt: number): void {
    const d = this.dialogue;
    if (!d || !d.started) return;
    d.elapsed += dt;
    this.lineElapsed += dt;
    const line = d.lines[d.index];
    if (!line) {
      this.endDialogue();
      return;
    }
    if (d.releaseAt >= 0 && d.index >= d.releaseAt && this.lineElapsed >= Math.min(RELEASE_AFTER_SEC, readSeconds(line.text))) {
      this.releaseDialogue(d);
      return;
    }
    if (this.lineFinished(line)) this.advanceDialogue(false);
  }

  private advanceDialogue(skipped: boolean, guarded = false): void {
    const d = this.dialogue;
    if (!d || !d.started) return;
    // A short guard so a letter held over from the previous moment never skips a line unseen.
    if (guarded && d.elapsed < 0.25) return;
    if (skipped) voice.cancel();
    d.index++;
    d.elapsed = 0;
    if (d.index >= d.lines.length) this.endDialogue();
    else this.showDialogueLine();
  }

  private endDialogue(): void {
    const d = this.dialogue;
    this.dialogue = null;
    patchRunUi({ subtitle: null });
    if (d) this.director.completeGatedBeat(d.beatId);
  }

  private queueBark(line: DialogueLine | undefined): void {
    if (!line) return;
    // Keep remarks timely: never let a backlog build up behind the action.
    if (this.barkQueue.length >= 3) this.barkQueue.shift();
    this.barkQueue.push(line);
  }

  /** Stop the line being said and move straight on to the next queued one. */
  private skipBark(): void {
    voice.cancel();
    this.currentBark = null;
    if (this.dialogue) {
      this.startDialogue();
      return;
    }
    const next = this.barkQueue.shift();
    if (!next) {
      patchRunUi({ subtitle: null });
      return;
    }
    this.currentBark = next;
    this.present(next, false);
  }

  /** The player started typing: stop the remark on screen and drop stale ones. */
  private dismissBarks(): void {
    if (!this.currentBark && this.barkQueue.length === 0) return;
    if (this.currentBark) voice.cancel();
    this.currentBark = null;
    this.barkQueue = [];
    patchRunUi({ subtitle: null });
  }

  private updateBarks(dt: number): void {
    if (this.dialogue?.started) return;
    if (this.currentBark) {
      this.lineElapsed += dt;
      if (!this.lineFinished(this.currentBark)) return;
      this.currentBark = null;
      if (this.dialogue) {
        this.startDialogue();
        return;
      }
      if (this.barkQueue.length === 0) patchRunUi({ subtitle: null });
    }
    const next = this.barkQueue.shift();
    if (!next) return;
    this.currentBark = next;
    this.present(next, false);
  }

  private fireBarks(trigger: BarkTrigger): void {
    const def = this.encounter?.def;
    if (!def?.barks) return;
    def.barks.forEach((bark, i) => {
      const key = `${def.id}:${i}`;
      if (this.firedBarks.has(key)) return;
      const w = bark.when;
      let match: boolean;
      switch (w.on) {
        case 'wave-start':
          match = trigger.on === 'wave-start' && trigger.wave === w.wave;
          break;
        case 'defeats':
          match = trigger.on === 'defeats' && trigger.count >= w.count;
          break;
        case 'focus-below':
          match = trigger.on === 'focus-below' && trigger.value < w.value;
          break;
        default:
          match = trigger.on === w.on;
      }
      if (match) {
        this.firedBarks.add(key);
        this.queueBark(getLine(bark.line));
      }
    });
  }

  // ---------- Choice (pre-boss) ----------

  private choiceOptions(): { id: string; label: string }[] {
    return [
      { id: 'continue', label: strings.choice.continue },
      { id: 'controls', label: strings.choice.controls },
      { id: 'difficulty', label: strings.choice.difficulty },
    ];
  }

  private publishChoice(): void {
    const c = this.choice;
    patchRunUi({ choice: c ? { options: this.choiceOptions(), index: c.panel === 'difficulty' ? c.difficultyIndex : c.index, panel: c.panel } : null });
  }

  /** Mouse/touch selection from the choice panel. */
  selectChoice(index: number): void {
    const c = this.choice;
    if (!c) return;
    if (c.panel === 'difficulty') c.difficultyIndex = index;
    else c.index = index;
    this.handleChoiceIntent({ kind: 'enter' });
  }

  private handleChoiceIntent(intent: KeyIntent): void {
    const c = this.choice;
    if (!c) return;
    const options = this.choiceOptions();
    if (c.panel === 'controls') {
      if (intent.kind === 'enter' || intent.kind === 'escape' || intent.kind === 'space') c.panel = 'none';
    } else if (c.panel === 'difficulty') {
      if (intent.kind === 'left') c.difficultyIndex = Math.max(0, c.difficultyIndex - 1);
      else if (intent.kind === 'right') c.difficultyIndex = Math.min(2, c.difficultyIndex + 1);
      else if (intent.kind === 'enter' || intent.kind === 'space') {
        this.setDifficulty(DIFFICULTY_ORDER[c.difficultyIndex] ?? 'standard');
        c.panel = 'none';
      } else if (intent.kind === 'escape') c.panel = 'none';
    } else if (intent.kind === 'left') {
      c.index = (c.index + options.length - 1) % options.length;
      audio.playSfx('ui-move');
    } else if (intent.kind === 'right' || intent.kind === 'tab') {
      c.index = (c.index + 1) % options.length;
      audio.playSfx('ui-move');
    } else if (intent.kind === 'enter' || intent.kind === 'space') {
      audio.playSfx('ui-select');
      const chosen = options[c.index]?.id;
      if (chosen === 'continue') {
        const beatId = c.beatId;
        this.choice = null;
        patchRunUi({ choice: null });
        this.director.completeGatedBeat(beatId);
        return;
      }
      c.panel = chosen === 'controls' ? 'controls' : 'difficulty';
    }
    this.publishChoice();
  }

  /** Difficulty can change at checkpoints and between encounters without restarting (§9). */
  setAssist(assist: boolean): void {
    this.progress.assist = assist;
    if (this.encounter) this.encounter.ctx.assist = assist;
    this.saveNow();
  }

  setDifficulty(difficulty: Difficulty): void {
    this.progress.difficulty = difficulty;
    if (DIFFICULTY[difficulty].unlimitedHp) this.setFocus(MAX_FOCUS);
    patchRunUi({ unlimitedHp: DIFFICULTY[difficulty].unlimitedHp });
    this.typing.setOptions({ rejectMistakes: DIFFICULTY[difficulty].rejectMistakes });
    this.saveNow();
  }

  get canChangeDifficulty(): boolean {
    return !this.isEncounterActive;
  }

  // ---------- Targets / labels ----------

  private refreshTargets(): void {
    const candidates = [...(this.encounter?.candidates() ?? []), ...(this.bonus?.candidates() ?? []), ...(this.gem?.candidates() ?? [])];
    const unlocks = this.typing.setCandidates(candidates);
    if (unlocks.length > 0) this.metrics.closeAttempt();
    const ids = [...this.allTargets()].map((t) => t.id);
    const current = useRunStore.getState().targetIds;
    if (ids.length !== current.length || ids.some((id, i) => id !== current[i])) patchRunUi({ targetIds: ids });
    this.refreshLabels();
  }

  refreshLabels(): void {
    if (this.focusResetTimer > 0) return;
    const view = this.typing.view;
    const labels: LabelInfo[] = [];
    for (const t of this.allTargets()) {
      if (t.phase !== 'active' || t.defeated || t.wordDelay > 0) continue;
      const word = t.words[t.stage];
      if (!word) continue;
      const locked = view.lockedId === t.id;
      labels.push({
        id: t.id,
        word,
        correctLength: locked ? view.correctLength : 0,
        wrongText: locked ? view.wrongText : '',
        locked,
        pendingPrefix: view.pendingIds.includes(t.id) ? view.pendingPrefix.length : 0,
        shielded: isShielded(t),
        optional: t.spawn.optional === true,
        priority: t.spawn.priority === true,
        kind: t.spawn.kind,
        stage: t.stage,
        stages: t.spawn.words.length,
        phrase: t.spawn.phrase ? t.spawn.words.map((w, i) => (typeof w === 'string' ? w : (t.words[i] ?? '…'))) : null,
        danger: t.attackPhase === 'windup',
        tabHint: view.lockedId !== null && !locked,
      });
    }
    patchRunUi({ labels });
  }

  // ---------- Saving ----------

  private commitMetrics(): void {
    this.metrics.suspend();
    this.committed = cloneMetrics(this.progress.metrics);
  }

  private requestSave(): void {
    if (this.saveIn < 0) this.saveIn = SAVE_DEBOUNCE_SEC;
  }

  private updateSaveTimer(dt: number): void {
    if (this.saveIn < 0) return;
    this.saveIn -= dt;
    if (this.saveIn <= 0) this.saveNow();
  }

  /** Writes the autosave immediately (debounce bypass). */
  saveNow(): void {
    this.saveIn = -1;
    if (!this.savesEnabled || this.ended) return;
    const snapshot: Level1Autosave = {
      ...this.progress,
      flags: [...this.flags],
      // Only committed typing metrics are saved; level time is always current.
      metrics: { ...cloneMetrics(this.committed), levelTimeMs: this.progress.metrics.levelTimeMs },
      savedAtIso: new Date().toISOString(),
    };
    if (writeAutosave(this.options.storage, snapshot, (id) => this.director.indexOf(id) >= 0)) {
      patchRunUi({ saveKey: nextKey() });
    }
  }

  // ---------- End ----------

  private finishLevel(): void {
    this.metrics.suspend();
    this.progress.status = 'complete';
    const metrics = this.progress.metrics;
    const results = buildResults(metrics, this.difficulty, this.progress.collectedStarPageIds, this.newCosmetics);
    const storage = this.options.storage;
    const profile = readProfile(storage);
    profile.levelCompleted = true;
    profile.bestResults = mergeBestResults(profile.bestResults, {
      bestAverageWpm: results.averageWpm,
      bestAccuracy: results.accuracy,
      bestStreak: results.bestStreak,
      fastestLevelMs: metrics.levelTimeMs,
      mostStarPages: results.starPages,
      bestScore: results.score,
    });
    writeProfile(storage, profile);
    this.committed = cloneMetrics(metrics);
    this.saveNow();
    this.ended = true;
    patchRunUi({ results, subtitle: null, labels: [] });
    this.options.onResults?.(results);
  }

  get isEnded(): boolean {
    return this.ended;
  }
}
