// 图标生成：把 public/assets/icon-1024.png 裁掉四边（顺带去掉右下角水印）后，
// 用盒式滤波缩成 manifest 和 favicon 需要的尺寸。纯 Node，不需要任何依赖。
//
//   node tools/make-icons.js
//
// 输出：public/assets/icon-512.png、icon-192.png、icon.png(64)
// 环境里没有 ImageMagick（convert 是 Windows 的磁盘工具）也没有能用的 Python，
// 所以 PNG 的解码/编码都在这里自己实现：zlib 是 Node 内置的。
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assets = path.join(__dirname, '..', 'public', 'assets');
const SRC = path.join(assets, 'icon-1024.png');
// 裁掉外围 10%：右下角的生成水印落在 81%~97% x、95%~97% y，裁完就不在了，
// 同时主体在画面里占比更大，缩到 16px 时更认得出来
const CROP = 0.10;

// ---------- CRC32 ----------
const CRC_TABLE = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c;
    }
    return t;
})();
function crc32(buf) {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
}

// ---------- 解码 ----------
function decodePNG(file) {
    const buf = fs.readFileSync(file);
    if (buf.readUInt32BE(0) !== 0x89504E47) throw new Error(file + ' 不是 PNG');
    let off = 8;
    let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
    const idat = [];
    while (off < buf.length) {
        const len = buf.readUInt32BE(off);
        const type = buf.toString('ascii', off + 4, off + 8);
        const data = buf.subarray(off + 8, off + 8 + len);
        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitDepth = data[8];
            colorType = data[9];
            interlace = data[12];
        } else if (type === 'IDAT') {
            idat.push(data);
        } else if (type === 'IEND') {
            break;
        }
        off += 12 + len;
    }
    if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error('只支持 8bit 非隔行的 RGB/RGBA PNG，实际 bitDepth=' + bitDepth +
            ' colorType=' + colorType + ' interlace=' + interlace);
    }
    const channels = colorType === 6 ? 4 : 3;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const bpp = channels;
    const stride = width * bpp;
    const out = Buffer.alloc(height * stride);

    const paeth = (a, b, c) => {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    };

    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)];
        const rowStart = y * (stride + 1) + 1;
        const cur = y * stride;
        const prev = (y - 1) * stride;
        for (let x = 0; x < stride; x++) {
            const v = raw[rowStart + x];
            const left = x >= bpp ? out[cur + x - bpp] : 0;
            const up = y > 0 ? out[prev + x] : 0;
            const upLeft = y > 0 && x >= bpp ? out[prev + x - bpp] : 0;
            let val;
            switch (filter) {
                case 0: val = v; break;
                case 1: val = v + left; break;
                case 2: val = v + up; break;
                case 3: val = v + ((left + up) >> 1); break;
                case 4: val = v + paeth(left, up, upLeft); break;
                default: throw new Error('未知行滤波类型 ' + filter);
            }
            out[cur + x] = val & 0xFF;
        }
    }
    return { width, height, channels, data: out };
}

// ---------- 裁剪 ----------
function crop(img, c0, size) {
    const out = Buffer.alloc(size * size * img.channels);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const s = ((y + c0) * img.width + (x + c0)) * img.channels;
            const d = (y * size + x) * img.channels;
            for (let c = 0; c < img.channels; c++) out[d + c] = img.data[s + c];
        }
    }
    return { width: size, height: size, channels: img.channels, data: out };
}

// ---------- 盒式滤波缩放 ----------
// 目标像素取源图上对应矩形区域的面积加权平均。整数倍缩放时退化成精确的块平均，
// 非整数倍（1024→192）时边缘像素按覆盖比例加权，比最近邻平滑得多。
function resize(img, w, h) {
    const src = img.data, W = img.width, H = img.height, ch = img.channels;
    const out = Buffer.alloc(w * h * ch);
    const acc = new Float64Array(ch);
    for (let dy = 0; dy < h; dy++) {
        const sy0 = dy * H / h, sy1 = (dy + 1) * H / h;
        const iy0 = Math.floor(sy0), iy1 = Math.ceil(sy1);
        for (let dx = 0; dx < w; dx++) {
            const sx0 = dx * W / w, sx1 = (dx + 1) * W / w;
            const ix0 = Math.floor(sx0), ix1 = Math.ceil(sx1);
            acc.fill(0);
            let area = 0;
            for (let iy = iy0; iy < iy1; iy++) {
                const wy = Math.min(iy + 1, sy1) - Math.max(iy, sy0);
                if (wy <= 0) continue;
                for (let ix = ix0; ix < ix1; ix++) {
                    const wx = Math.min(ix + 1, sx1) - Math.max(ix, sx0);
                    if (wx <= 0) continue;
                    const wgt = wx * wy;
                    const s = (iy * W + ix) * ch;
                    for (let c = 0; c < ch; c++) acc[c] += src[s + c] * wgt;
                    area += wgt;
                }
            }
            const d = (dy * w + dx) * ch;
            for (let c = 0; c < ch; c++) out[d + c] = Math.round(acc[c] / area);
        }
    }
    return { width: w, height: h, channels: ch, data: out };
}

// ---------- 编码 ----------
function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
}

function encodePNG(img) {
    const { width, height, channels, data } = img;
    const stride = width * channels;
    const rows = Buffer.alloc(height * (stride + 1));
    for (let y = 0; y < height; y++) {
        rows[y * (stride + 1)] = 0; // 每行用 None 滤波：扁平色块压缩率已经很好
        data.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;                       // bitDepth
    ihdr[9] = channels === 4 ? 6 : 2;  // colorType
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

// ---------- 主流程 ----------
const src = decodePNG(SRC);
if (src.width !== src.height) throw new Error('源图必须是正方形，实际 ' + src.width + 'x' + src.height);
const c0 = Math.round(src.width * CROP);
const size = src.width - c0 * 2;
const cropped = crop(src, c0, size);
console.log('源图 ' + src.width + 'x' + src.height + ' -> 裁剪 ' + size + 'x' + size);

const targets = [
    [512, 'icon-512.png'],
    [192, 'icon-192.png'],
    [64, 'icon.png']
];
for (const [px, name] of targets) {
    const buf = encodePNG(resize(cropped, px, px));
    fs.writeFileSync(path.join(assets, name), buf);
    console.log('  ' + name.padEnd(13) + px + 'x' + px + '  ' + buf.length + ' 字节');
}
