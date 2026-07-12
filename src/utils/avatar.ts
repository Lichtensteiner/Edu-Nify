export function md5(value: string): string {
  const str = value.trim().toLowerCase();
  let k = [];
  let i = 0;
  for (i = 0; i < 64; i++) {
    k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  }
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  const utf8 = unescape(encodeURIComponent(str));
  const words = [];
  for (i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << ((i % 4) * 8);
  }
  words[utf8.length >> 2] |= 0x80 << ((utf8.length % 4) * 8);
  const wordCount = ((utf8.length + 8) >> 6) * 16 + 14;
  while (words.length < wordCount) {
    words.push(0);
  }
  words[wordCount] = utf8.length * 8;

  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(rotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  for (i = 0; i < words.length; i += 16) {
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;

    a = ff(a, b, c, d, words[i + 0], 7, k[0]);
    d = ff(d, a, b, c, words[i + 1], 12, k[1]);
    c = ff(c, d, a, b, words[i + 2], 17, k[2]);
    b = ff(b, c, d, a, words[i + 3], 22, k[3]);
    a = ff(a, b, c, d, words[i + 4], 7, k[4]);
    d = ff(d, a, b, c, words[i + 5], 12, k[5]);
    c = ff(c, d, a, b, words[i + 6], 17, k[6]);
    b = ff(b, c, d, a, words[i + 7], 22, k[7]);
    a = ff(a, b, c, d, words[i + 8], 7, k[8]);
    d = ff(d, a, b, c, words[i + 9], 12, k[9]);
    c = ff(c, d, a, b, words[i + 10], 17, k[10]);
    b = ff(b, c, d, a, words[i + 11], 22, k[11]);
    a = ff(a, b, c, d, words[i + 12], 7, k[12]);
    d = ff(d, a, b, c, words[i + 13], 12, k[13]);
    c = ff(c, d, a, b, words[i + 14], 17, k[14]);
    b = ff(b, c, d, a, words[i + 15], 22, k[15]);

    a = gg(a, b, c, d, words[i + 1], 5, k[16]);
    d = gg(d, a, b, c, words[i + 6], 9, k[17]);
    c = gg(c, d, a, b, words[i + 11], 14, k[18]);
    b = gg(b, c, d, a, words[i + 0], 20, k[19]);
    a = gg(a, b, c, d, words[i + 5], 5, k[20]);
    d = gg(d, a, b, c, words[i + 10], 9, k[21]);
    c = gg(c, d, a, b, words[i + 15], 14, k[22]);
    b = gg(b, c, d, a, words[i + 4], 20, k[23]);
    a = gg(a, b, c, d, words[i + 9], 5, k[24]);
    d = gg(d, a, b, c, words[i + 14], 9, k[25]);
    c = gg(c, d, a, b, words[i + 3], 14, k[26]);
    b = gg(b, c, d, a, words[i + 8], 20, k[27]);
    a = gg(a, b, c, d, words[i + 13], 5, k[28]);
    d = gg(d, a, b, c, words[i + 2], 9, k[29]);
    c = gg(c, d, a, b, words[i + 7], 14, k[30]);
    b = gg(b, c, d, a, words[i + 12], 20, k[31]);

    a = hh(a, b, c, d, words[i + 5], 4, k[32]);
    d = hh(d, a, b, c, words[i + 8], 11, k[33]);
    c = hh(c, d, a, b, words[i + 11], 16, k[34]);
    b = hh(b, c, d, a, words[i + 14], 23, k[35]);
    a = hh(a, b, c, d, words[i + 1], 4, k[36]);
    d = hh(d, a, b, c, words[i + 4], 11, k[37]);
    c = hh(c, d, a, b, words[i + 7], 16, k[38]);
    b = hh(b, c, d, a, words[i + 10], 23, k[39]);
    a = hh(a, b, c, d, words[i + 13], 4, k[40]);
    d = hh(d, a, b, c, words[i + 0], 11, k[41]);
    c = hh(c, d, a, b, words[i + 3], 16, k[42]);
    b = hh(b, c, d, a, words[i + 6], 23, k[43]);
    a = hh(a, b, c, d, words[i + 9], 4, k[44]);
    d = hh(d, a, b, c, words[i + 12], 11, k[45]);
    c = hh(c, d, a, b, words[i + 15], 16, k[46]);
    b = hh(b, c, d, a, words[i + 2], 23, k[47]);

    a = ii(a, b, c, d, words[i + 0], 6, k[48]);
    d = ii(d, a, b, c, words[i + 7], 10, k[49]);
    c = ii(c, d, a, b, words[i + 14], 15, k[50]);
    b = ii(b, c, d, a, words[i + 5], 21, k[51]);
    a = ii(a, b, c, d, words[i + 12], 6, k[52]);
    d = ii(d, a, b, c, words[i + 3], 10, k[53]);
    c = ii(c, d, a, b, words[i + 10], 15, k[54]);
    b = ii(b, c, d, a, words[i + 1], 21, k[55]);
    a = ii(a, b, c, d, words[i + 8], 6, k[56]);
    d = ii(d, a, b, c, words[i + 15], 10, k[57]);
    c = ii(c, d, a, b, words[i + 6], 15, k[58]);
    b = ii(b, c, d, a, words[i + 13], 21, k[59]);
    a = ii(a, b, c, d, words[i + 4], 6, k[60]);
    d = ii(d, a, b, c, words[i + 11], 10, k[61]);
    c = ii(c, d, a, b, words[i + 2], 15, k[62]);
    b = ii(b, c, d, a, words[i + 9], 21, k[63]);

    h0 = safeAdd(a, h0);
    h1 = safeAdd(b, h1);
    h2 = safeAdd(c, h2);
    h3 = safeAdd(d, h3);
  }

  const hex = [h0, h1, h2, h3].map((val) => {
    let s = '';
    for (let j = 0; j < 4; j++) {
      s += ((val >> (j * 8 + 4)) & 0x0f).toString(16) + ((val >> (j * 8)) & 0x0f).toString(16);
    }
    return s;
  }).join('');

  return hex;
}

export function getUserAvatarUrl(user: { email?: string; prenom?: string; nom?: string; photo?: string } | null | undefined): string {
  if (!user) {
    return 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff&size=128';
  }
  
  if (user.photo && user.photo.trim() !== '') {
    return user.photo;
  }
  
  const email = user.email || '';
  if (!email || !email.includes('@')) {
    const name = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=128`;
  }
  
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
}
