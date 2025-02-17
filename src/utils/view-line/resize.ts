import { toFloat } from '..';
import { DIST } from './constants';
import { hideAlignLine, showAlignLine } from './lines/align';
import { hideDistLine, showDistLine } from './lines/distance';
import { hideLabel, showLabel } from './lines/label';
import { calcLines } from './lines/lib';
import { hideSpaceLine } from './lines/space';

function calcTarSize(top, left, height, width, vLine, hLine) {
  let tarLeft = left,
    tarTop = top,
    tarHeight = height,
    tarWidth = width;
  if (vLine) {
    if (vLine.from.pos < vLine.pos + DIST && vLine.from.pos > vLine.pos - DIST) {
      if (vLine.from.type === 'vl') {
        tarLeft = vLine.pos;
        tarWidth = width + (vLine.from.pos - vLine.pos);
      } else if (vLine.from.type === 'vm') {
        // tarLeft = vLine.pos - width / 2;
      } else if (vLine.from.type === 'vr') {
        tarWidth = width + (vLine.pos - vLine.from.pos);
        tarLeft = vLine.pos - tarWidth;
      }
    }
  }
  if (hLine) {
    if (hLine.from.pos < hLine.pos + DIST && hLine.from.pos > hLine.pos - DIST) {
      if (hLine.from.type === 'ht') {
        tarTop = hLine.pos;
        tarHeight = height + (hLine.from.pos - hLine.pos);
      } else if (hLine.from.type === 'hm') {
        tarTop = hLine.pos - height / 2;
      } else if (hLine.from.type === 'hb') {
        tarHeight = height + (hLine.pos - hLine.from.pos);
        tarTop = hLine.pos - tarHeight;
      }
    }
  }
  return {
    top: tarTop,
    left: tarLeft,
    height: tarHeight,
    width: tarWidth,
  };
}

const DIRECTION = {
  tc: ['ht'],
  bc: ['hb'],
  rc: ['vr'],
  lc: ['vl'],
  tl: ['ht', 'vl'],
  tr: ['ht', 'vr'],
  br: ['hb', 'vr'],
  bl: ['hb', 'vl'],
};

function getTarLine(line, include: string[] = []) {
  let v = line.v.filter((item) => {
    return include.indexOf(item.type) >= 0;
  });
  let h = line.h.filter((item) => {
    return include.indexOf(item.type) >= 0;
  });
  return {
    v,
    h,
  };
}

let last;
function caclHandType(top, left, height, width) {
  if (!last) {
    last = {
      top,
      left,
      height,
      width,
    };
    return [];
  }
  let lines: string[] = [];
  if (top !== last.top) {
    lines.push('ht');
  }

  if (left !== last.left) {
    lines.push('vl');
  }

  if (top === last.top && left === last.left && width !== last.width) {
    lines.push('vr');
  }

  if (top === last.top && left === last.left && height !== last.height) {
    lines.push('hb');
  }
  return lines;
}

export function hideLines() {
  last = null;
  hideAlignLine();
  hideSpaceLine('h');
  hideSpaceLine('v');
  hideDistLine();
  hideLabel();
}

export const resizeByDom = ({ dom, top, left, height, width, scaleSize }, onResizeEnd) => {
  if (!dom) {
    return;
  }

  let cotainer = dom.parentNode.getBoundingClientRect();
  let offsetTop = cotainer.top;
  let offsetLeft = cotainer.left;
  let handType = caclHandType(top, left, height, width);
  let allLines = calcLines(top, left, height, width);
  let tarLine = getTarLine(allLines, handType);
  let nearLine = showAlignLine(tarLine, offsetTop, offsetLeft);

  let tarLeft = left,
    tarTop = top,
    tarHeight = height,
    tarWidth = width;
  if (nearLine) {
    let { vLine, hLine } = nearLine;
    let tarPos = calcTarSize(top, left, height, width, vLine, hLine);
    tarLeft = tarPos.left;
    tarTop = tarPos.top;
    tarHeight = tarPos.height;
    (tarWidth = tarPos.width), 0;

    if (left != tarLeft || top != tarTop || height != tarHeight || width != tarWidth) {
      showAlignLine(calcLines(tarTop, tarLeft, tarHeight, tarWidth), offsetTop, offsetLeft);
    }

    let map = { vl: 0, vm: 1, vr: 2, ht: 0, hm: 1, hb: 2 };
    if (vLine) {
      let fromVLine = vLine.from;
      if (tarLeft != left || tarWidth != width) {
        let newLine = calcLines(tarTop, tarLeft, tarHeight, tarWidth);
        fromVLine = newLine.v[map[fromVLine.type]];
      }
      showDistLine('v', fromVLine, vLine, offsetTop, offsetLeft);
    }
    if (hLine) {
      let fromHLine = hLine.from;
      if (tarTop != top || tarHeight != height) {
        let newLine = calcLines(tarTop, tarLeft, tarHeight, tarWidth);
        fromHLine = newLine.h[map[fromHLine.type]];
      }
      showDistLine('h', fromHLine, hLine, offsetTop, offsetLeft);
    }
  }

  const _top = toFloat(tarTop / scaleSize, 0);
  const _left = toFloat(tarLeft / scaleSize, 0);
  const w = toFloat(tarWidth / scaleSize, 0);
  const h = toFloat(tarHeight / scaleSize, 0);
  dom.style.top = `${_top}px`;
  dom.style.left = `${_left}px`;
  dom.firstChild.style.height = `${h}px`;
  dom.firstChild.style.width = `${w}px`;

  showLabel(dom, `${w} x ${h}`, true);
  onResizeEnd?.({
    y: _top,
    x: _left,
    h,
    w,
  });
};
