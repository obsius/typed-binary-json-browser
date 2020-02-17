(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Tbjson = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol.for === 'function')
    ? Symbol.for('nodejs.util.inspect.custom')
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
(function (Buffer){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

// magic number for file type
const MAGIC_NUMBER = '.tbj';
const SIZE_MAGIC_NUMBER = 4; // error

const ERROR = -1; // primitive types

const NULL = 0;
const BOOL = 1;
const UINT8 = 2;
const INT8 = 3;
const UINT16 = 4;
const INT16 = 5;
const UINT32 = 6;
const INT32 = 7;
const FLOAT32 = 8;
const FLOAT64 = 9; // higher-order types			

const STRING = 10;
const ARRAY = 11;
const OBJECT = 12;
const NULLABLE = 13;
const TYPED_ARRAY = 14;
const UNKNOWN = 15; // extras

const VARIABLE_DEF = 16; // primitive sizes			
const SIZE_INT8 = 1;
const SIZE_UINT8 = 1;
const SIZE_INT16 = 2;
const SIZE_UINT16 = 2;
const SIZE_INT32 = 4;
const SIZE_UINT32 = 4;
const SIZE_FLOAT32 = 4;
const SIZE_FLOAT64 = 8; // offsets

const NULLABLE_OFFSET = 16;
const TYPED_ARRAY_OFFSET = 32;
const TYPE_OFFSET = 48;
const PROTOTYPE_OFFSET = 64; // support 16 types

const NULLABLE_PROTOTYPE_OFFSET = 256; // support 192 prototypes

const ARRAY_OFFSET = 512;
const OBJECT_OFFSET = 4096; // support 4x nested array
// legacy offsets

const L_NULLABLE_PROTOTYPE_OFFSET = 160;
const L_ARRAY_OFFSET = 256;
const L_OBJECT_OFFSET = 1024;

class Type {
  constructor(reference, serializer, deserializer) {
    this.reference = reference;
    this.serializer = serializer;
    this.deserializer = deserializer;
  }

}

class Prototype {
  constructor(definition, prototype = null, parentCode = null, noInherit = false) {
    this.definition = definition;
    this.prototype = prototype;
    this.parentCode = parentCode;
    this.noInherit = noInherit;
  }

}

const DEFAULT_BUFFER_SIZE = 16384;
const DEFAULT_X_FACTOR = 2;
const DEFAULT_STR_ENCODING = 'utf-8';
class BufferWriter {
  constructor(size = DEFAULT_BUFFER_SIZE, xFactor = DEFAULT_X_FACTOR, strEncoding = DEFAULT_STR_ENCODING) {
    _defineProperty(this, "offset", 0);

    this.buffer = Buffer.allocUnsafe(size);
    this.xFactor = xFactor;
    this.strEncoding = strEncoding;
  }

  get size() {
    return this.buffer.length;
  }

  getBuffer() {
    return this.buffer.slice(0, this.offset);
  }

  grow() {
    this.buffer = Buffer.concat([this.buffer, Buffer.allocUnsafe(this.size * Math.floor(this.xFactor / 2))]);
  }

  writeFixedLengthString(val) {
    this.buffer.write(val, this.offset, val.length, this.strEncoding);
    this.offset += val.length;
  }

  write(type, val) {
    switch (type) {
      case NULL:
        val = 0;

      case BOOL:
      case UINT8:
        this.checkSize(SIZE_UINT8);
        this.buffer.writeUInt8(val, this.offset);
        this.offset += SIZE_UINT8;
        break;

      case INT8:
        this.checkSize(SIZE_INT8);
        this.buffer.writeInt8(val, this.offset);
        this.offset += SIZE_INT8;
        break;

      case UINT16:
        this.checkSize(SIZE_UINT16);
        this.buffer.writeUInt16BE(val, this.offset);
        this.offset += SIZE_UINT16;
        break;

      case INT16:
        this.checkSize(SIZE_INT16);
        this.buffer.writeInt16BE(val, this.offset);
        this.offset += SIZE_INT16;
        break;

      case UINT32:
        this.checkSize(SIZE_UINT32);
        this.buffer.writeUInt32BE(val, this.offset);
        this.offset += SIZE_UINT32;
        break;

      case INT32:
        this.checkSize(SIZE_INT32);
        this.buffer.writeInt32BE(val, this.offset);
        this.offset += SIZE_INT32;
        break;

      case FLOAT32:
        this.checkSize(SIZE_FLOAT32);
        this.buffer.writeFloatBE(val, this.offset);
        this.offset += SIZE_FLOAT32;
        break;

      case FLOAT64:
        this.checkSize(SIZE_FLOAT64);
        this.buffer.writeDoubleBE(val, this.offset);
        this.offset += SIZE_FLOAT64;
        break;

      case STRING:
        if (typeof val != 'string' || !val.length) {
          this.write(UINT8, 0);
        } else {
          this.writeVariableUint(val.length);
          this.checkSize(val.length);
          this.buffer.write(val, this.offset, val.length, this.strEncoding);
          this.offset += val.length;
        }

        break;

      case UNKNOWN:
        switch (typeof val) {
          case 'boolean':
            this.write(UINT8, BOOL);
            this.write(BOOL, val);
            break;

          case 'number':
            this.write(UINT8, FLOAT64);
            this.write(FLOAT64, val);
            break;

          case 'string':
            this.write(UINT8, STRING);
            this.write(STRING, val);
            break;

          default:
            this.write(NULL);
        }

    }
  }

  writeVariableUint(val) {
    if (val < 128) {
      // R00000000 (first bit reserved)
      this.write(UINT8, val);
    } else if (val < 16384) {
      // 1R000000 (second bit reserved)
      this.write(UINT16, val + 32768);
    } else {
      this.write(UINT32, val + 3221225472);
    }
  }

  writeFixedLengthStr(val) {
    this.checkSize(val.length);
    this.buffer.write(val, this.offset, val.length, this.strEncoding);
    this.offset += val.length;
  }

  writeBuffer(buffer) {
    this.checkSize(buffer.length);
    buffer.copy(this.buffer, this.offset);
    this.offset += buffer.length;
  }
  /* private */


  checkSize(size) {
    while (this.offset + size > this.size) {
      this.grow();
    }
  }

}

class BufferReader {
  constructor(buffer) {
    _defineProperty(this, "offset", 0);

    this.buffer = buffer;
  }

  read(type) {
    let data;

    switch (type) {
      case BOOL:
        data = !!this.buffer.readUInt8(this.offset);
        this.offset += SIZE_UINT8;
        break;

      case UINT8:
        data = this.buffer.readUInt8(this.offset);
        this.offset += SIZE_UINT8;
        break;

      case INT8:
        data = this.buffer.readInt8(this.offset);
        this.offset += SIZE_INT8;
        break;

      case UINT16:
        data = this.buffer.readUInt16BE(this.offset);
        this.offset += SIZE_UINT16;
        break;

      case INT16:
        data = this.buffer.readInt16BE(this.offset);
        this.offset += SIZE_INT16;
        break;

      case UINT32:
        data = this.buffer.readUInt32BE(this.offset);
        this.offset += SIZE_UINT32;
        break;

      case INT32:
        data = this.buffer.readInt32BE(this.offset);
        this.offset += SIZE_INT32;
        break;

      case FLOAT32:
        data = this.buffer.readFloatBE(this.offset);
        this.offset += SIZE_FLOAT32;
        break;

      case FLOAT64:
        data = this.buffer.readDoubleBE(this.offset);
        this.offset += SIZE_FLOAT64;
        break;

      case STRING:
        let length = this.readVariableUint();
        data = this.buffer.toString('utf-8', this.offset, this.offset + length);
        this.offset += length;
        break;

      case UNKNOWN:
        data = this.read(this.read(UINT8));
    }

    return data;
  }

  readVariableUint() {
    if (this.buffer[this.offset] < 128) {
      return this.read(UINT8);
    } else if (this.buffer[this.offset] < 192) {
      return this.read(UINT16) - 32768;
    } else {
      return this.read(UINT32) - 3221225472;
    }
  }

  readFixedLengthString(length) {
    let data = this.buffer.toString('utf-8', this.offset, this.offset + length);
    this.offset += length;
    return data;
  }

  readTypedArray(type, length) {
    let byteOffset = this.buffer.byteOffset + this.offset;
    let buffer = this.buffer.buffer.slice(byteOffset, byteOffset + length);
    this.offset += length;

    switch (type) {
      case UINT8:
        return new Uint8Array(buffer);

      case INT8:
        return new Int8Array(buffer);

      case UINT16:
        return new Uint16Array(buffer);

      case INT16:
        return new Int16Array(buffer);

      case UINT32:
        return new Uint32Array(buffer);

      case INT32:
        return new Int32Array(buffer);

      case FLOAT32:
        return new Float32Array(buffer);

      case FLOAT64:
        return new Float64Array(buffer);
    }
  }
  /* private */


  nextNullAt() {
    for (let i = this.offset; i < this.buffer.length; ++i) {
      if (!this.buffer[i]) {
        return i;
      }
    }

    throw new Error('BufferReader could not find a null value');
  }

}

class StreamBufferWriter extends BufferWriter {
  constructor(stream, size, xFactor, strEncoding) {
    super(size, xFactor, strEncoding);

    _defineProperty(this, "streamIndex", 0);

    _defineProperty(this, "streamReady", true);

    this.stream = stream;
  }
  /* private */


  flush() {
    this.streamReady = this.stream.write(this.buffer.slice(this.streamIndex, this.offset), () => {
      this.streamReady = true;
    });

    if (this.streamReady) {
      this.offset = 0;
      this.streamIndex = 0;
    } else {
      this.streamIndex = this.offset;
    }

    return this.streamReady;
  }

  checkSize(size) {
    while (this.offset + size > this.size) {
      if (this.streamReady && !this.flush()) {
        this.grow();
      } else {
        this.grow();
      }
    }
  }

}

class StreamBufferReader {
  constructor(stream, size = 8388608) {
    this.stream = stream;
    this.size = size;
    this.tempSize = size;
    this.buffer = Buffer.allocUnsafe(size);
    this.writeOffset = 0;
    this.readOffset = 0;
    this.stream.on('data', chunk => {
      if (this.writeOffset + chunk.length > this.tempSize) {
        this.stream.pause();
      }

      this.buffer.fill(chunk, this.writeOffset, this.writeOffset + chunk.length);
      this.writeOffset += chunk.length;

      if (this.waitingRead) {
        this.waitingRead();
      }
    });
  }

  readUntilNull(fn) {
    for (let i = this.readOffset; i < this.buffer.length; ++i) {
      if (this.buffer[i] == null) {
        fn(this.buffer.slice(this.offset, i));
        this.incReadOffset(i - this.readOffset);
      }
    }
  }

  read(type, length = 0) {
    switch (type) {
      case UINT32:
        this.readBytes(SIZE_UINT32, readOffset => fn(this.buffer.readUInt32(readOffset)));
        break;

      case FLOAT32:
        this.readBytes(SIZE_FLOAT32, readOffset => fn(this.buffer.readFloat32(readOffset)));
        break;

      case STRING:
        if (length) {
          this.readBytes(length, readOffset => fn(this.buffer.toString('utf-8', readOffset, length)));
        } else {
          this.readUntilNull();
        }

    }
  }
  /* private */


  incReadOffset(length) {
    this.readOffset += length;

    if (this.readOffset > this.size) {
      this.writeOffset = this.buffer.length - this.writeOffset;
      this.readOffset = 0;
      this.newBuffer = Buffer.allocUnsafe(this.size);
      this.newBuffer.fill(this.offset, this.buffer.length);
      this.buffer = this.newBuffer;

      if (this.stream.isPaused()) {
        this.stream.resume();
      }
    }
  }

  readBytes(length) {
    if (this.readOffset + length > this.writeOffset) {
      return new Promise((res, rej) => {
        if (this.size < this.readOffset + length) {
          this.tmpSize = this.readOffset + length;
        }

        this.waitingRead = () => {
          this.tempSize = this.size;
          this.readBytes(length, fn);
        };
      });
    } else {
      let readOffset = this.readOffset;
      this.incReadOffset(length);
      return readOffset;
    }
  }

}

const DEFAULT_STR_ENCODING$1 = 'utf-8';
const DEFAULT_NUM_ENCODING = FLOAT64;
const DEFAULT_BUFFER_SIZE$1 = 1048576;
/**
 * Tbjson
 * 
 * A JS TBJSON serializer and parser.
 */

class Tbjson {
  // TODO: for registered types (primitives)
  // for registered prototypes (classes)
  // for plain objects that are inside of known prototypers
  // for variable definitions
  // binary definition tree
  // counters for converting types and prototypes to an incrementing numeric value
  // default offsets
  // default options
  constructor(types = [], prototypes = [], offsets = {}, options = {}) {
    _defineProperty(this, "typeRefs", {});

    _defineProperty(this, "types", {});

    _defineProperty(this, "protoRefs", {});

    _defineProperty(this, "protos", {});

    _defineProperty(this, "objs", {});

    _defineProperty(this, "variableDefs", {});

    _defineProperty(this, "root", null);

    _defineProperty(this, "nextObjCode", 0);

    _defineProperty(this, "nextTypeCode", TYPE_OFFSET);

    _defineProperty(this, "nextProtoCode", void 0);

    _defineProperty(this, "finalized", false);

    _defineProperty(this, "offsets", {
      prototype: PROTOTYPE_OFFSET,
      nullablePrototype: NULLABLE_PROTOTYPE_OFFSET,
      array: ARRAY_OFFSET,
      object: OBJECT_OFFSET
    });

    _defineProperty(this, "options", {
      encStringAs: DEFAULT_STR_ENCODING$1,
      encNumberAs: DEFAULT_NUM_ENCODING,
      bufferSize: DEFAULT_BUFFER_SIZE$1
    });

    this.offsets = { ...this.offsets,
      ...offsets
    };
    this.options = { ...this.options,
      ...options
    };
    this.nextProtoCode = this.offsets.prototype;
    this.registerTypes(types);
    this.registerPrototypes(prototypes);
  }
  /*-----------------------------------------------------------------------*/

  /* registers */

  /**
   * Register a variable definition so that any prototypes with the same variable definition id are replaced before serializing.
   * 
   * @param { number | string } id - the identifier of this variable definition
   * @param {obj} def - the definition to set to
   */


  registerVariableDef(id, def) {
    this.variableDefs[id] = def;
  }
  /**
   * Register a prototype / class or plain objecct for serilization and deserialization.
   * If using Class.tbjson = { ... } you must call this for each class, and then call finalizePrototypes for inheritance to work.
   * 
   * Example:
   *
   * Tbjson.registerPrototype(Point); // point must have tbjson set on it: Point.tbjson = { definition: ... } 
   * 
   * Tbjson.registerPrototype({
   *     prototype: Point1,
   *     definition: {
   *         x: Tbjson.TYPES.FLOAT32,
   *         y: Tbjson.TYPES.FLOAT32
   *     },
   *     reference: 'Point',
   *     parentReference: Point0
   * });
   * 
   * Tbjson.registerPrototype({
   *     reference: Point,
   *     definition: {
   *         x: Tbjson.TYPES.FLOAT32,
   *         y: Tbjson.TYPES.FLOAT32
   * });
   * 
   * @param { function | object } prototype - class / prototype constructor or a plain object that represents one
   */


  registerPrototype(prototype) {
    if (this.finalized) {
      if (typeof prototype == 'function' && prototype.tbjson) {
        return this.protoRefs[prototype.name];
      }

      return;
    } // a prototype


    if (typeof prototype == 'function') {
      // check if it's a known tbjson prototype
      if (prototype.tbjson) {
        // TODO: REMOVE THIS
        if (!prototype.tbjson.definition) {
          throw new Error(`Missing definition for "${prototype.name}"`);
        }

        prototype = {
          prototype: prototype,
          ...prototype.tbjson
        };
      } else {
        prototype = {
          prototype
        };
      }
    } // if the ref is not set, use the name


    if (!prototype.reference) {
      prototype.reference = prototype.prototype.name;
    }

    let code = this.protoRefs[prototype.reference]; // assign a new reference and definition

    if (!code) {
      code = this.nextProtoCode++;
      this.protoRefs[prototype.reference] = code;
    } // this code has not been defined


    if (!this.protos[code] || !this.protos[code].definition) {
      let parentCode; // get the parent code

      if (prototype.definition) {
        let parent = !prototype.noInherit && prototype.parentReference ? prototype.parentReference : getParent(prototype.prototype);
        parentCode = parent ? this.registerPrototype(parent) : null;
      } // format the definition


      let definition = prototype.definition ? this.fmtDef(prototype.definition) : null;

      if (definition == ERROR) {
        throw new Error(`Invalid definition for: ${prototype.prototype.name}`);
      } // set the prototype


      this.protos[code] = new Prototype(definition, prototype.prototype, parentCode, prototype.noInherit);
    }

    return code;
  }
  /**
   * Register an array of prototypes.
   * 
   * Example:
   * 
   * [{
   *     constructor: Point,
   *     definition: {
   *         x: Tbjson.TYPES.FLOAT32,
   *         y: Tbjson.TYPES.FLOAT32,
   *         z: Tbjson.TYPES.FLOAT32
   *     }
   * }, {
   *     constructor: Line,
   *     reference: 'Line2',
   *     parentReference: 'Line1',
   *     noInherit: true,
   *     definition: {
   *         point1: 'Point',
   *         point2: 'Point'
   *     }
   * }]
   * 
   * @param {[]object} prototypes - array of prototypes 
   */


  registerPrototypes(prototypes = []) {
    for (let prototype of prototypes) {
      this.registerPrototype(prototype);
    }
  }
  /**
   * TODO:
   * Register a type.
   * 
   * Example:
   * 
   * tbjson.registerType('Float48', (data, buffer) => {}, (buffer) => obj);
   * 
   * @param {object} type - type to add
   */


  registerType(type) {}
  /**
   * TODO:
   * Register types.
   * 
   * Example:
   * 
   * [{
   *     ref: 'Float48',
   *     serializer: function(data, buffer) {
   *         buffer.writeUint8(...);
   *     },
   *     deserializer: function(buffer) {
   *         let num = buffer.readUint8(...);
   *         return num;
   *     }
   * }]
   * 
   * @param {[]object} types - array of types to register 
   */


  registerTypes(types = []) {
    for (let type of types) {
      this.registerType(ref, type.serializer, type.deserializer);
    }
  }
  /**
   * If using inheritance, this must be called before serialization to update definitions.
   */


  finalizePrototypes() {
    let finalizedProtos = {};

    while (Object.keys(finalizedProtos).length < Object.keys(this.protos).length) {
      for (let code in this.protos) {
        // don't run on finalized prototypes
        if (finalizedProtos[code]) {
          continue;
        }

        let prototype = this.protos[code]; // finalize if there is no parent code or if the prototype is set to not inherit

        if (!prototype.parentCode || prototype.noInherit) {
          finalizedProtos[code] = true;
          continue;
        } // throw an error if a parent code is missing


        if (!this.protos[prototype.parentCode]) {
          throw new Error('Missing a parent prototype or definition');
        } // parent is finalized, so this can be to


        if (finalizedProtos[prototype.parentCode]) {
          // if the definition isn't an object, just use it and ignore any parent definitions
          if (typeof prototype.definition == 'object') {
            prototype.definition = Object.assign({}, this.protos[prototype.parentCode].definition, prototype.definition);
          }

          finalizedProtos[code] = true;
        }
      }
    }

    this.finalized = true;
  }
  /*-----------------------------------------------------------------------*/

  /* serializers */

  /**
   * Serialize the obj to a buffer.  Fastest, but uses the most memory.
   * 
   * @param {object} obj - object to serialize 
   */


  serializeToBuffer(obj) {
    try {
      this.processVariableDefs(); // make a writer

      this.writer = new BufferWriter(this.options.bufferSize); // process the obj

      this.root = this.serialize(obj); // add the header to the front

      return Buffer.concat([this.getHeaderAsBuffer(), this.writer.getBuffer()]);
    } catch (e) {
      e.message = 'Tbjson failed to serialize to the buffer: ' + e.message;
      throw e;
    }
  }
  /**
   * Serialize the object to the stream.  Slower, but uses the least memory.
   * 
   * @param {stream} stream - stream to serialize to
   * @param {object} obj - object to serialize 
   */


  serializeToStream(stream, obj) {
    try {
      this.processVariableDefs(); // make a writer

      this.writer = new StreamBufferWriter(stream, this.options.bufferSize); // process the obj

      this.root = this.serialize(obj); // flush and cleanup

      this.writer.flush();
      this.writer = null;
    } catch (e) {
      e.message = 'Tbjson failed to serialize to the stream: ' + e.message;
      throw e;
    }
  }
  /**
   * Serialize the object to a file. Opens as a write stream, so it's slower and uses less memory.
   * 
   * @param {string} filename - filename / path to write to
   * @param {object} obj - object to serialize
   */


  serializeToFile(filename, obj) {
    return new Promise((res, rej) => {
      try {
        this.processVariableDefs();
        let tempFilename = `${filename}.tmp`; // write the data to a tmp file

        let writeStream = fs.createWriteStream(tempFilename, 'binary');
        this.serializeToStream(writeStream, obj);
        writeStream.end(); // write the final file

        writeStream = fs.createWriteStream(filename, 'binary'); // write the header

        writeStream.write(this.getHeaderAsBuffer()); // pipe the tmp file to the final file

        let readStream = fs.createReadStream(tempFilename, 'binary');
        readStream.pipe(writeStream);
        readStream.on('end', () => {
          // cleanup
          fs.unlinkSync(tempFilename);
          res();
        });
      } catch (e) {
        e.message = `Tbjson Failed to serialize object to "${filename}": ` + e.message;
        rej(e);
      }
    });
  }
  /*-----------------------------------------------------------------------*/

  /* parsers */

  /**
   * Parse a TBJSON containing buffer into ab object. Fastest, but uses the most memory.
   * 
   * @param {buffer} buffer - buffer to read from
   * @param {array} selector - anarray that indicates the selected object path
   */


  parseBuffer(buffer, selector = null) {
    try {
      if (!buffer) {
        throw new Error('Null buffer passed in');
      }

      this.reader = new BufferReader(buffer); // validate the buffer type

      if (this.reader.readFixedLengthString(SIZE_MAGIC_NUMBER) != MAGIC_NUMBER) {
        throw new Error('Buffer is not a Typed Binary JSON format');
      } // get the header length


      let headerLength = this.reader.read(UINT32); // read and parse the header

      this.parseHeader(this.reader.readFixedLengthString(headerLength)); // construct the object

      if (selector) {
        return this.parseAtSelection(this.root, selector);
      } else {
        return this.parse(this.root);
      }
    } catch (e) {
      e.message = 'Tbjson failed to parse the buffer: ' + e.message;
      throw e;
    }
  }
  /**
   * TODO:
   * Parse a TBJSON containing stream into an object. Slower, but uses the least memory.
   * 
   * @param {stream} stream - stream to read from
   * @param {array} selector - anarray that indicates the selected object path
   */


  parseStream(stream, selector = null) {
    return new Promise(async (res, rej) => {
      this.reader = new StreamBufferReader(stream); // validate the stream type

      if ((await this.reader.readFixedLengthString(SIZE_MAGIC_NUMBER)) != MAGIC_NUMBER) {
        rej(new Error('Stream is not a Typed Binary JSON format'));
      } // get the header length


      let headerLength = await this.reader.read(UINT32); // read and parse the header

      this.parseHeader((await this.reader.readFixedLengthString(headerLength))); // construct the object

      if (selector) {
        res((await this.parseAtSelection(this.root, selector)));
      } else {
        res((await this.parse(this.root)));
      }
    });
  }
  /**
   * Parse a TBJSON file into the object it represents. Faster, but uses more memory.
   * 
   * @param {string} filename - filename / path to read from
   * @param {array} selector - anarray that indicates the selected object path
   */


  parseFileAsBuffer(filename, selector = null) {
    try {
      return this.parseBuffer(fs.readFileSync(filename), selector);
    } catch (e) {
      e.message = `Tbjson failed to parse "${filename}": ` + e.message;
      throw e;
    }
  }
  /**
   * Parse a TBJSON file into the object it represents. Slower, but uses less memory.
   * 
   * @param {string} filename - filename / path to read from
   * @param {array} selector - anarray that indicates the selected object path
   */


  async parseFileAsStream(filename, selector = null) {
    try {
      return await this.parseStream(fs.createReadStream(filename), selector);
    } catch (e) {
      e.message = `Tbjson failed to parse "${filename}": ` + e.message;
      throw e;
    }
  }
  /*-----------------------------------------------------------------------*/

  /* helpers */

  /**
   * Get the header object after serialization.
   * Useful if you are writing your custom own stream.
   */


  getHeader() {
    // get the type serializers / deserializers
    let typeDefs = {};

    for (let code in this.types) {
      typeDefs[code] = {
        serializer: type.serializer ? this.types[code].serializer.toString() : null,
        deserializer: type.deserializer ? this.types[code].deserializer.toString() : null
      };
    } // get the prototype definitions


    let protoDefs = {};

    for (let code in this.protos) {
      protoDefs[code] = this.protos[code].definition ? this.protos[code].definition : null;
    }

    return {
      offsets: this.offsets,
      typeRefs: this.typeRefs,
      typeDefs: typeDefs,
      protoRefs: this.protoRefs,
      protoDefs: protoDefs,
      objs: this.objs,
      root: this.root
    };
  }
  /**
   * Get the header object as a buffer.
   * Useful if you are writing your custom format.
   */


  getHeaderAsBuffer() {
    try {
      // header string
      let headerStr = JSON.stringify(this.getHeader()); // make a new buffer, add the header, append the binary

      let buffer = new BufferWriter(SIZE_MAGIC_NUMBER + SIZE_UINT32 + headerStr.length); // str - magic number

      buffer.writeFixedLengthString(MAGIC_NUMBER); // uint32 - header length

      buffer.write(UINT32, headerStr.length); // str - header

      buffer.writeFixedLengthString(headerStr);
      return buffer.buffer;
    } catch (e) {
      e.message = 'Tbjson failed to create a buffer for the header: ' + e.message;
      throw e;
    }
  }
  /**
   * Parse a TBJSON header from a string.
   * Useful if you are writing your own deserializer.
   * 
   * @param {string} headerStr - string containing the encoded JSON header 
   */


  parseHeader(headerStr) {
    try {
      let header = JSON.parse(headerStr); // types

      this.typeRefs = header.typeRefs;
      this.types = {};

      for (let code in header.typeDefs) {
        this.types[code] = new Type(Function(header.typeDefs[code].serializer), Function(header.typeDefs[code].deserializer));
      } // prototypes (preserve proto constructors for typed parsing)


      this.protoRefs = header.protoRefs;

      for (let code in header.protoDefs) {
        if (this.protos[code]) {
          this.protos[code].definition = header.protoDefs[code];
        } else {
          this.protos[code] = new Prototype(header.protoDefs[code]);
        }
      } // unknown objects


      this.objs = header.objs; // set the root

      this.root = header.root; // offsets

      if (header.offsets) {
        this.offsets = header.offsets; // legacy file, use old offsets
      } else {
        this.offsets = {
          prototype: PROTOTYPE_OFFSET,
          nullablePrototype: L_NULLABLE_PROTOTYPE_OFFSET,
          array: L_ARRAY_OFFSET,
          object: L_OBJECT_OFFSET
        };
      }
    } catch (e) {
      e.message = 'Tbjson failed to parse header string: ' + e.message;
      throw e;
    }
  }
  /*-----------------------------------------------------------------------*/

  /* private */

  /**
   * Process all prototype definitions and variable definitions.
   */


  processVariableDefs() {
    for (let code in this.protos) {
      if (this.protos[code].definition) {
        this.protos[code].definition = this.replaceVariableDefs(this.protos[code].definition);
      }
    }
  }
  /**
   * Replace a variable definition with the corresponding registered one.
   * 
   * @param {obj} def - the definition to check and replace 
   */


  replaceVariableDefs(def) {
    if (typeof def == 'object') {
      // an array, could be a variable definition
      if (Array.isArray(def)) {
        if (def.length == 2) {
          switch (def[0]) {
            // a variable def
            case VARIABLE_DEF:
              // missing a definition, throw an error
              if (!this.variableDefs[def[1]]) {
                throw new Error(`Unknown variable def: "${def[1]}"`);
              }

              return this.variableDefs[def[1]];
            // another valid tbjson qualifier

            case ARRAY:
            case TYPED_ARRAY:
            case NULLABLE:
            case OBJECT:
              def[1] = this.replaceVariableDefs(def[1]);
              return def;
          }
        } // a fixed-length array


        for (let i = 0; i < def.length; ++i) {
          def[i] = this.replaceVariableDefs(def[i]);
        } // a definition

      } else {
        for (let key in def) {
          def[key] = this.replaceVariableDefs(def[key]);
        }
      }
    }

    return def;
  }
  /**
   * Format the definition to its number representations.
   * 
   * Converts the more verbose array definitions to simpler numeric ones:
   * 
   * [Tbjson.TYPES.ARRAY, Tbjson.TYPES.FLOAT32] -> ARRAY + FLOAT32 = 12 + 9 = 21
   * [Tbjson.TYPES.Array, Class] ->                ARRAY + NUM_CLASS = 12 + x
   * [Tbjson.TYPES.Array, "class"] ->              ARRAY + NUM_CLASS = 12 + x
   * 
   * @param { object | array | number } def - the definition specifying how to decode the binary data
   */


  fmtDef(def) {
    switch (typeof def) {
      // already in number form, just return it
      case 'number':
        return def;
      // string referencing a prototype, add the string to the reference lookup table

      case 'string':
        if (this.protoRefs[def]) {
          return this.protoRefs[def];
        }

        this.protoRefs[def] = this.nextProtoCode++;
        return this.protoRefs[def];
      // prototype (class)

      case 'function':
        return this.registerPrototype(def);
      // object or array

      case 'object':
        // invalid null
        if (!def) {
          break; // array
        } else if (Array.isArray(def)) {
          // typed array
          if (def.length == 2 && typeof def[0] == 'number') {
            // array
            if (def[0] == ARRAY) {
              return this.offsets.array + this.fmtDef(def[1]); // nullable
            } else if (def[0] == NULLABLE) {
              let subDef = this.fmtDef(def[1]); // primitive

              if (subDef < NULLABLE_OFFSET) {
                return NULLABLE_OFFSET + subDef; // prototype
              } else {
                return this.offsets.nullablePrototype + subDef;
              } // primitive typed array

            } else if (def[0] == TYPED_ARRAY) {
              return TYPED_ARRAY_OFFSET + this.fmtDef(def[1]); // object
            } else if (def[0] == OBJECT) {
              return this.offsets.object + this.fmtDef(def[1]); // variable
            } else if (def[0] == VARIABLE_DEF) {
              return def;
            } // fixed length array

          } else {
            let fmtDef = new Array(def.length);

            for (let i = 0; i < def.length; ++i) {
              fmtDef[i] = this.fmtDef(def[i]);
            }

            return fmtDef;
          } // simple object

        } else {
          let fmtDef = {};

          for (let key in def) {
            fmtDef[key] = this.fmtDef(def[key]);
          }

          return fmtDef;
        }
    } // must have an invalid definition


    return ERROR;
  }
  /**
   * Serialize the object based on its definition. Only run for known prototypes.
   * 
   * @param { object } obj - the object to serialize
   * @param { object | array | number } def - the definition specifying how to decode the binary data
   * @param { bool } isArray - special case for an unknown def that is an array
   */


  serializeDef(obj, def, isArray) {
    // no def, could be a known but undefined prototype, or a plain object, kick back to the serializer
    if (!def) {
      // write the code
      let code = this.nextObjCode++;
      this.writer.write(UINT16, code);
      let ref; // write the array

      if (isArray) {
        ref = new Array(obj.length);

        for (let i = 0; i < obj.length; ++i) {
          ref[i] = this.serialize(obj[i]);
        } // write the obj

      } else {
        ref = {};

        for (let key in obj) {
          ref[key] = this.serialize(obj[key]);
        }
      }

      this.objs[code] = ref;
      return;
    }

    switch (typeof def) {
      // typed
      case 'number':
        // primitive
        if (def < NULLABLE_OFFSET) {
          // an unknown object
          if (def == OBJECT) {
            this.serializeDef(obj); // an unknown array
          } else if (def == ARRAY) {
            this.serializeDef(obj, null, true); // primitive
          } else {
            this.writer.write(def, obj);
          } // nullable primitive

        } else if (def < TYPED_ARRAY_OFFSET) {
          if (obj == null) {
            this.writer.write(UINT8, 0);
          } else {
            this.writer.write(UINT8, 1);
            this.writer.write(def - NULLABLE_OFFSET, obj);
          } // primitive typed array

        } else if (def < TYPE_OFFSET) {
          this.writer.write(UINT32, obj.buffer.byteLength);
          this.writer.writeBuffer(Buffer.from(obj.buffer)); // custom type
        } else if (def < this.offsets.prototype) ; else if (def < this.offsets.array) {
          let valid = obj != null && typeof obj == 'object'; // validate the object

          if (def < this.offsets.nullablePrototype) {
            if (!valid) {
              throw new Error(`Null objects cannot be passed into known prototypes, mark as a nullable known prototype instead: ${this.protos[def] ? this.protos[def].prototype : def}`);
            } // null values allowed, mark it as null or not

          } else {
            if (valid) {
              def -= this.offsets.nullablePrototype;
              this.writer.write(BOOL, true);
            } else {
              this.writer.write(NULL);
              return;
            }
          } // known type


          if (obj.constructor.tbjson) {
            // register the prototype if needed
            this.registerPrototype(obj.constructor); // call the unbuild function for pre serialization 

            if (obj.constructor.tbjson.unbuild) {
              obj = obj.constructor.tbjson.unbuild(obj);
            }
          }

          this.serializeDef(obj, this.protos[def].definition); // variable-length fixed typed array 
        } else if (def < this.offsets.object) {
          // if valid, continue
          if (obj && Array.isArray(obj)) {
            // write out the length
            this.writer.write(UINT32, obj.length);

            for (let i = 0; i < obj.length; ++i) {
              this.serializeDef(obj[i], def - this.offsets.array);
            } // if not valid, auto-cast into an empty array

          } else {
            this.writer.write(UINT32, 0);
          } // uniform object

        } else {
          // if valid, continue
          if (obj && typeof obj == 'object' && !Array.isArray(obj)) {
            // write out the length
            this.writer.write(UINT32, Object.keys(obj).length); // write out the keys and values

            for (let key in obj) {
              this.writer.write(STRING, key);
              this.serializeDef(obj[key], def - this.offsets.object);
            } // if not valid, auto-cast into an empty object

          } else {
            this.writer.write(UINT32, 0);
          }
        }

        break;
      // oject or array

      case 'object':
        // fixed-length variable type array
        if (Array.isArray(def)) {
          for (let i = 0; i < def.length; ++i) {
            this.serializeDef(obj[i], def[i]);
          } // object

        } else {
          for (let key in def) {
            this.serializeDef(obj[key], def[key]);
          }
        }

        break;
      // invalid

      default:
        throw new Error(`Invalid definition: ${def}`);
    }
  }
  /**
   * Serialize an object. Can be known (TBJSON has a definition for it) or plain (Class or object that TBJSON doesn't have a definition for).
   * Calls serializeDef() if a known type is found.
   * 
   * @param {object} obj - the object to serialize
   */


  serialize(obj) {
    switch (typeof obj) {
      // bool
      case 'boolean':
        this.writer.write(BOOL, obj);
        return BOOL;
      // number

      case 'number':
        this.writer.write(FLOAT64, obj);
        return FLOAT64;
      // string

      case 'string':
        this.writer.write(STRING, obj);
        return STRING;
      // null, object, or array

      case 'object':
        // null
        if (!obj) {
          return NULL; // array
        } else if (Array.isArray(obj)) {
          let refs = new Array(obj.length);

          for (let i = 0; i < obj.length; ++i) {
            refs[i] = this.serialize(obj[i]);
          }

          return refs; // primitive typed array
        } else if (ArrayBuffer.isView(obj)) {
          let ref = NULL;

          if (obj instanceof Uint8Array) {
            ref = TYPED_ARRAY_OFFSET + UINT8;
          } else if (obj instanceof Int8Array) {
            ref = TYPED_ARRAY_OFFSET + INT8;
          } else if (obj instanceof Uint16Array) {
            ref = TYPED_ARRAY_OFFSET + UINT16;
          } else if (obj instanceof Int16Array) {
            ref = TYPED_ARRAY_OFFSET + INT16;
          } else if (obj instanceof Uint32Array) {
            ref = TYPED_ARRAY_OFFSET + UINT32;
          } else if (obj instanceof Int32Array) {
            ref = TYPED_ARRAY_OFFSET + INT32;
          } else if (obj instanceof Float32Array) {
            ref = TYPED_ARRAY_OFFSET + FLOAT32;
          } else if (obj instanceof Float64Array) {
            ref = TYPED_ARRAY_OFFSET + FLOAT64;
          }

          if (ref) {
            this.writer.write(UINT32, obj.buffer.byteLength);
            this.writer.writeBuffer(Buffer.from(obj.buffer));
          }

          return ref; // object or known prototype
        } else {
          // the object is a prototype
          if (obj.constructor) {
            // a known tbjson prototype to be added, or a lookup if not known
            let code = obj.constructor.tbjson ? this.registerPrototype(obj.constructor) : this.protoRefs[obj.constructor.name];

            if (code != null) {
              // unbuild
              if (obj.constructor.tbjson && obj.constructor.tbjson.unbuild) {
                obj = obj.constructor.tbjson.unbuild(obj);
              } // process the prototype definition


              this.serializeDef(obj, this.protos[code].definition);
              return code;
            }
          } // simple object, traverse accordingly


          let ref = {};

          for (let key in obj) {
            ref[key] = this.serialize(obj[key]);
          }

          return ref;
        }

    }
  }
  /**
   * Parse a definition, but only return the portion that matches the selector.
   * 
   * TODO: IMPLEMENT NULL READER TO SKIP ENTRIES FOR PERFORMANCE
   * 
   * @param { object | array | number } def - the definition specifying how to decode the binary data
   * @param {array} selector - quit early and return the value selected by this
   */


  parseAtSelection(def, selector, path = [], prototype) {
    // forward a plain object
    if (typeof def == 'number' && def == OBJECT) {
      return this.parseAtSelection(this.objs[this.reader.read(UINT16)], selector, path); // forward a known prototype
    } else if (typeof def == 'number' && def >= this.offsets.prototype && def < this.offsets.array) {
      let proto = this.protos[def];
      return this.parseAtSelection(proto.definition ? proto.definition : this.objs[this.reader.read(UINT16)], selector, path, proto.prototype); // control the object path
    } else if (typeof def == 'object' && !Array.isArray(def)) {
      let selection = selector.shift();

      for (let key in def) {
        if (key == selection) {
          if (!selector.length) {
            return this.parse(def[key], prototype);
          } else {
            return this.parseAtSelection(def[key], selector, path.concat([selection]));
          }
        }

        this.parse(def[key]);
      } // read to the void

    } else {
      this.parse(def);
    }

    return null;
  }
  /**
   * Parse a definition.
   * 
   * @param { object | array | number } def - the definition specifying how to decode the binary data
   * @param {function} prototype - [optional] create this type during object instantiation
   */


  parse(def, prototype) {
    // type
    if (typeof def == 'number') {
      // primitive
      if (def < NULLABLE_OFFSET) {
        // null
        if (def == NULL) {
          return null; // unknown object or array
        } else if (def == OBJECT || def == ARRAY) {
          return this.parse(this.objs[this.reader.read(UINT16)]); // primitive
        } else {
          return this.reader.read(def);
        } // nullable primitive

      } else if (def < TYPED_ARRAY_OFFSET) {
        // non null
        if (this.reader.read(UINT8)) {
          return this.reader.read(def - NULLABLE_OFFSET); // null
        } else {
          return null;
        } // primitive typed array

      } else if (def < TYPE_OFFSET) {
        return this.reader.readTypedArray(def - TYPED_ARRAY_OFFSET, this.reader.read(UINT32)); // custom type
      } else if (def < this.offsets.prototype) {
        return this.reader.read(def); // known prototype
      } else if (def < this.offsets.array) {
        // nullable
        if (def >= this.offsets.nullablePrototype) {
          // null
          if (!this.reader.read(UINT8)) {
            return null;
          }

          def -= this.offsets.nullablePrototype;
        }

        let proto = this.protos[def];
        return this.parse(proto.definition ? proto.definition : this.objs[this.reader.read(UINT16)], proto.prototype); // variable-length fixed typed array 
      } else if (def < this.offsets.object) {
        let length = this.reader.read(UINT32);
        let objs = new Array(length);

        for (let i = 0; i < length; ++i) {
          objs[i] = this.parse(def - this.offsets.array);
        }

        return objs; // uniform object
      } else {
        let length = this.reader.read(UINT32);
        let obj = {};

        for (let i = 0; i < length; ++i) {
          obj[this.parse(STRING)] = this.parse(def - this.offsets.object);
        }

        return obj;
      } // fixed-length array

    } else if (Array.isArray(def)) {
      let objs = new Array(def.length);

      for (let i = 0; i < def.length; ++i) {
        objs[i] = this.parse(def[i]);
      }

      return objs; // object
    } else {
      let obj = prototype ? new prototype() : {};

      for (let key in def) {
        obj[key] = this.parse(def[key]);
      } // call the build function for post construction


      if (prototype && prototype.tbjson && prototype.tbjson.build) {
        prototype.tbjson.build(obj);
      }

      return obj;
    }
  }

}
Tbjson.TYPES = {
  NULL,
  BOOL,
  INT8,
  UINT8,
  INT16,
  UINT16,
  INT32,
  UINT32,
  FLOAT32,
  FLOAT64,
  STRING,
  ARRAY,
  OBJECT,
  NULLABLE,
  TYPED_ARRAY,
  UNKNOWN,
  VARIABLE_DEF
};
/**
 * Cast a plain object into the typed object it represents. Only supports prototype definitions, not strings.
 * 
 * @param {string} obj - object to parse
 * @param {function} prototype - prototype to cast into
 */

Tbjson.cast = (obj, prototype, definitions = {}) => {
  // plain object or array with a definition (ignore prototyped)
  if (prototype && (typeof prototype == 'function' || typeof prototype == 'object')) {
    let isNonNullObject = typeof obj == 'object' && obj;
    let isArray = Array.isArray(prototype);
    let isArrayTypeDef = Array.isArray(prototype) && prototype.length == 2; // array

    if (Array.isArray(obj) && isArray) {
      let typedObj; // typed array

      if (isArrayTypeDef && prototype[0] == ARRAY) {
        typedObj = new Array(obj.length);

        for (let i = 0; i < obj.length; ++i) {
          typedObj[i] = Tbjson.cast(obj[i], prototype[1], definitions);
        } // unknown array

      } else {
        typedObj = new Array(prototype.length);

        for (let i = 0; i < prototype.length; ++i) {
          typedObj[i] = Tbjson.cast(obj[i], prototype[i], definitions);
        }
      }

      return typedObj; // qualified type
    } else if (isArrayTypeDef) {
      switch (prototype[0]) {
        // uniform value object
        case OBJECT:
          let typedObj = {};

          if (isNonNullObject) {
            for (let key in obj) {
              typedObj[key] = Tbjson.cast(obj[key], prototype[1], definitions);
            }
          }

          return typedObj;
        // nullable object

        case NULLABLE:
          return obj == null ? null : Tbjson.cast(obj, prototype[1], definitions);
        // variable def, won't know this when casting

        case VARIABLE_DEF:
          return obj;
      } // non-prototyped object

    } else if (!obj || !obj.constructor || obj.constructor.prototype == Object.prototype) {
      // prototype is tbjson with a definition
      if (prototype.tbjson && prototype.tbjson.definition) {
        let typedObj = new prototype();
        let definition;

        if (isNonNullObject) {
          // use map
          if (definitions[prototype.name]) {
            definition = definitions[prototype.name]; // check for parent
          } else {
            definition = prototype.tbjson.definition; // only check for a parent if the definition is an object

            if (typeof definition == 'object') {
              for (let parent = prototype; parent = getParent(parent);) {
                if (!parent.tbjson || !parent.tbjson.definition) {
                  break;
                }

                definition = Object.assign({}, parent.tbjson.definition, definition);
              }

              definitions[prototype.name] = definition;
            }
          } // fallback to the prototype if definition is an object


          if (definition == OBJECT) {
            for (let key in typedObj) {
              if (key in obj) {
                typedObj[key] = obj[key];
              }
            } // continue deeper

          } else {
            for (let key in definition) {
              if (key in obj) {
                typedObj[key] = Tbjson.cast(obj[key], definition[key], definitions);
              }
            }
          }
        } // call the build function for post construction


        if (prototype.tbjson.build) {
          prototype.tbjson.build(typedObj);
        }

        return typedObj; // prototype is a raw definition
      } else {
        let typedObj = {};

        if (isNonNullObject) {
          for (let key in prototype) {
            if (key in obj) {
              typedObj[key] = Tbjson.cast(obj[key], prototype[key], definitions);
            }
          }
        }

        return typedObj;
      }
    }
  } // primitive, untyped, or prototyped


  return obj;
};
/**
 * Serialize the typed object into a plain object ignoring typing rules, but obeying which properties should be ignored.
 * 
 * @param {string} obj - object to serialize
 */


Tbjson.serialize = (obj, definitions = {}) => {
  // object or array
  if (obj && typeof obj == 'object') {
    // array
    if (Array.isArray(obj)) {
      let retObj = new Array(obj.length);

      for (let i = 0; i < obj.length; ++i) {
        retObj[i] = Tbjson.serialize(obj[i], definitions);
      }

      return retObj; // object
    } else {
      let retObj = {}; // typed

      if (typeof obj.constructor == 'function' && obj.constructor.tbjson && obj.constructor.tbjson.definition) {
        let definition = definitions[obj.constructor.name]; // do a lookup for the parent definitions and flatten into one

        if (!definition) {
          definition = obj.constructor.tbjson.definition;

          for (let parent = obj.constructor; parent = getParent(parent);) {
            if (!parent.tbjson || !parent.tbjson.definition) {
              break;
            }

            definition = Object.assign({}, parent.tbjson.definition, definition);
          }

          definitions[obj.constructor.name] = definition;
        }

        let constructor = obj.constructor; // unbuild

        if (constructor.tbjson.unbuild) {
          obj = constructor.tbjson.unbuild(obj);
        }

        for (let key in definition) {
          retObj[key] = Tbjson.serialize(obj[key], definitions);
        } // plain

      } else {
        for (let key in obj) {
          retObj[key] = Tbjson.serialize(obj[key], definitions);
        }
      }

      return retObj;
    }
  } // primitive


  return obj;
};
/**
 * Clone the typed object into a prototyped object ignoring typing rules, but obeying which properties should be ignored.
 * 
 * @param {string} obj - object to serialize
 */


Tbjson.clone = (obj, definitions = {}) => {
  // object or array
  if (obj && typeof obj == 'object') {
    // array
    if (Array.isArray(obj)) {
      let retObj = new Array(obj.length);

      for (let i = 0; i < obj.length; ++i) {
        retObj[i] = Tbjson.clone(obj[i], definitions);
      }

      return retObj; // object
    } else {
      let retObj = {}; // typed

      if (typeof obj.constructor == 'function' && obj.constructor.tbjson && obj.constructor.tbjson.definition) {
        let definition = definitions[obj.constructor.name]; // do a lookup for the parent definitions and flatten into one

        if (!definition) {
          definition = obj.constructor.tbjson.definition;

          for (let parent = obj.constructor; parent = getParent(parent);) {
            if (!parent.tbjson || !parent.tbjson.definition) {
              break;
            }

            definition = Object.assign({}, parent.tbjson.definition, definition);
          }

          definitions[obj.constructor.name] = definition;
        }

        let constructor = obj.constructor; // unbuild

        if (constructor.tbjson.unbuild) {
          obj = constructor.tbjson.unbuild(obj);
        } // custom clone function


        if (constructor.tbjson.clone) {
          retObj = constructor.tbjson.clone(obj); // generic clone function
        } else {
          for (let key in definition) {
            retObj[key] = Tbjson.clone(obj[key], definitions);
          } // cast


          retObj = Tbjson.cast(retObj, constructor);
        } // date object

      } else if (obj instanceof Date) {
        retObj = new Date(obj.getTime()); // plain
      } else {
        for (let key in obj) {
          retObj[key] = Tbjson.clone(obj[key], definitions);
        }
      }

      return retObj;
    }
  } // primitive


  return obj;
};
/**
 * Return the flattened TBJSON definition. For prototypes that have parents.
 * 
 * @param {obj} obj - object to compute definition of 
 */


Tbjson.definition = obj => {
  if (obj && typeof obj == 'object' && obj.constructor.tbjson && obj.constructor.tbjson.definition) {
    let definition = obj.constructor.tbjson.definition;

    for (let parent = obj.constructor; parent = getParent(parent);) {
      if (!parent.tbjson || !parent.tbjson.definition) {
        break;
      }

      definition = Object.assign({}, parent.tbjson.definition, definition);
    }

    return definition;
  }
};
/* internal */

/**
 * Return the parent of a prototype.
 * 
 * @param {function} prototype - prototype to check for parent of 
 */


function getParent(prototype) {
  let parent = prototype ? Object.getPrototypeOf(prototype) : null;
  return parent && parent.name ? parent : null;
}

module.exports = Tbjson;

}).call(this,require("buffer").Buffer)
},{"buffer":3,"fs":2}],6:[function(require,module,exports){
 module.exports = require('typed-binary-json');
},{"typed-binary-json":5}]},{},[6])(6)
});
