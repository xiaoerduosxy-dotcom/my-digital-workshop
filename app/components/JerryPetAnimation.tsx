import Image from 'next/image';
import type { CSSProperties } from 'react';
import { JERRY_PAT_DURATION, jerryTransferDuration, type JerryPatScene, type JerryTransferKind, type JerryTransferScene } from '@/lib/workshop-pet-jerry';
import type { PetFacing } from '@/lib/workshop-pet';
import jerryHolding from '@/public/jerry-holding-cat.webp';
import jerryPetting from '@/public/jerry-petting.webp';
import catPoses from '@/public/workshop-pet-poses.webp';
import styles from './workshop-pet.module.css';

export const jerryMotionSource = '/jerry-motion-poses.webp';

function motionPose(box: JerryTransferScene['held']): CSSProperties {
  return { ...box, width: box.width * 1.4, backgroundImage: `url(${jerryMotionSource})` };
}

export function JerryPatAnimation({ scene }: { scene: JerryPatScene }) {
  return (
    <div
      className={styles.jerryReachMask}
      style={{ ...scene.frame, '--jerry-duration': `${JERRY_PAT_DURATION}ms` } as CSSProperties}
      data-jerry-petting
      aria-hidden="true"
    >
      <Image src={jerryPetting} alt="" className={styles.jerryReachBody} style={scene.art} loading="eager" unoptimized />
      <Image src={jerryPetting} alt="" className={styles.jerryReachArm} style={scene.art} loading="eager" unoptimized />
      <div className={styles.jerryMotionPose} style={motionPose(scene.folded)} data-jerry-pose="fold" />
    </div>
  );
}

export function JerryTransferAnimation({ scene, kind, pose, sprite, facing }: {
  scene: JerryTransferScene;
  kind: JerryTransferKind;
  pose: string;
  sprite: string;
  facing?: PetFacing;
}) {
  const { portraitBox, standingFit, standingSource, held, cat, landing, endScale } = scene;
  const fromX = cat.left + cat.width * .5;
  const fromY = cat.top + cat.height * .55;
  const dx = landing.x - fromX;
  const dy = landing.y - fromY;
  const jumpHeight = Math.min(84, cat.height * .63, landing.y - cat.height * endScale * .5 - 8);
  const stageStyle = { '--jerry-duration': `${jerryTransferDuration[kind]}ms` } as CSSProperties;
  const finalStyle = {
    ...portraitBox,
    '--held-bottom': `${Math.min(held.height, portraitBox.height - held.top)}px`,
  } as CSSProperties;
  const poseStyle = motionPose(held);
  const catStyle = {
    ...cat,
    '--travel-x': `${dx}px`,
    '--travel-y': `${dy}px`,
    '--mid-x': `${dx * .49}px`,
    '--mid-y': `${kind === 'jump' ? Math.min(0, dy) - Math.max(24, jumpHeight) : dy * .37}px`,
    '--catch-y': `${dy + (kind === 'lift' ? 8 : 4)}px`,
    '--end-scale': endScale,
  } as CSSProperties;

  return (
    <div className={styles.jerryTransferStage} style={stageStyle} data-jerry-transfer={kind} aria-hidden="true">
      <div className={styles.jerryTransferInProgress}>
        <div className={styles.jerryTransferPortrait} style={portraitBox}>
          <div className={styles.jerryTransferStand}>
            <Image src={standingSource} alt="" fill style={{ objectFit: standingFit, objectPosition: 'center top' }} loading="eager" unoptimized />
          </div>
          <div className={styles.jerryMotionPose} style={poseStyle} data-jerry-pose={kind} />
          <div className={styles.jerryMotionPose} style={poseStyle} data-jerry-pose="cradle" />
        </div>
        <div className={styles.jerryTransferCat} style={catStyle} data-approach-side={dx > 0 ? 'left' : 'right'}>
          <div className={styles.jerryCatGround}>
            <span className={styles.catFrame} data-pose={pose} data-facing={facing} style={{ backgroundImage: `url(${sprite})` }} />
          </div>
          <span className={styles.jerryCatAir} style={{ backgroundImage: `url(${catPoses.src})` }} />
        </div>
        <div className={styles.jerryTransferGrip} style={portraitBox}>
          {kind === 'lift' && <div className={styles.jerryMotionPose} style={poseStyle} data-jerry-pose="lift" />}
          <div className={styles.jerryMotionPose} style={poseStyle} data-jerry-pose="cradle" />
        </div>
      </div>
      <div className={styles.jerryTransferFinal} style={finalStyle}>
        <Image src={jerryHolding} alt="" className={styles.jerryTransferHeld} style={held} loading="eager" unoptimized />
      </div>
    </div>
  );
}
