const cryptoHash = require('./crypto-hash')

describe('cryptoHash()', () => {

    it('generates a SHA-256 hashed output', () => {
        expect(cryptoHash('Marek'))
            .toEqual('4ab4d783f6ce46a1dfee8183e66acad697911a4b5bdb2afb9a214d8f30c7fe43')
    })

    it('produces the same hash with the same input arguments in any order', () => {
        expect(cryptoHash('one', 'two', 'three'))
        .toEqual(cryptoHash('three', 'two', 'one'))
    })

    it('produces a unique hash when the properties have changed on an input', () => {
        const foo = {}
        const originalHash = cryptoHash(foo)
        foo['a'] = 'a'
        expect(cryptoHash(foo)).not.toEqual(originalHash)
    })

})