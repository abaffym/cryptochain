const Blockchain = require('./index')
const Block = require('./block');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');

describe('Blockchain', () => {
    let blockchain, newChain, originalChain;

    beforeEach(() => {
        blockchain = new Blockchain()
        newChain = new Blockchain()

        originalChain = blockchain.chain
    })

    it('contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true)
    })

    it('starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis())
    })

    it('adds a new block to the chain', () => {
        const newData = 'foo bar'
        blockchain.addBlock({ data: newData })

        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData)
    })

    describe('isValidChain()', () => {
        describe('when the chain does not start with the genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = { data: 'fake-genesis' }
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
            })
        })
        describe('when the chain starts with the genesis blockand has multiple blocks', () => {

            beforeEach(() => {
                blockchain.addBlock({ data: 'Bears' })
                blockchain.addBlock({ data: 'Beats' })
                blockchain.addBlock({ data: 'Battlestar Galactica' })
            })

            describe('and a lastHash reference has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-lastHash'

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })
            })

            describe('and the chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = 'broken-data'

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })
            })

            describe('and the chain does not contain any invalid blocks', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true)
                })
            })
        })
    })

    describe('replaceChain()', () => {
        let errorMock, logMock

        beforeEach(() => {
            errorMock = jest.fn()
            logMock = jest.fn()

            global.console.error = errorMock
            global.console.log = logMock
        })

        describe('when the new chain is not longer', () => {
            beforeEach(() => {
                newChain.chain[0] = { new: 'chain' }
                blockchain.replaceChain(newChain.chain)
            })

            it('does not replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain)
            })

            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled()
            })
        })

        describe('when the new chain is longer', () => {
            beforeEach(() => {
                transaction = new Wallet().createTransaction({ recipient: 'foo', amount: 50 })

                newChain.addBlock({ data: [transaction] })
                newChain.addBlock({ data: [transaction] })
                newChain.addBlock({ data: [transaction] })
            })

            describe('and the chain is invalid', () => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'broken-hash'
                    blockchain.replaceChain(newChain)
                })

                it('does not replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain)
                })

                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled()
                })
            })

            describe('and the chain is valid', () => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain)
                })

                it('replaces the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain)
                })
                it('logs about the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled()
                })
            })
        })
    })

    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet

        beforeEach(() => {
            wallet = new Wallet()
            transaction = wallet.createTransaction({ recipient: 'foo', amount: 65 })
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet })
        })

        describe('and the transaction data is valid', () => {
            it('returns true', () => {
                newChain.addBlock({ data: [transaction, rewardTransaction] })

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true)
            })
        })

        describe('and the transaction data has multipe rewards', () => {
            it('returns false', () => {
                newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] })

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
            })
        })

        describe('and the transaction data has at least one malformed outputMap', () => {
            describe('and the transaction is not a reward transaction', () => {
                it('returns false', () => {
                    transaction.outputMap[wallet.publicKey] = 999999

                    newChain.addBlock({ data: [transaction, rewardTransaction] })

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
                })
            })

            describe('and the transaction is a reward transaction', () => {
                it('returns false', () => {
                    rewardTransaction.outputMap[wallet.publicKey] = 999999

                    newChain.addBlock({ data: [transaction, rewardTransaction] })

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)

                })
            })
        })

        describe('and the transaction data has at least one malformed input', () => {
            it('returns false', () => {
                wallet.balance = 9000

                const evilOutputMap = {
                    [wallet.publicKey]: 8900,
                    'foo-recipient': 100
                }

                const evilTransaction = {
                    input: {
                        timestamp: Date.now(),
                        amount: wallet.balance,
                        address: wallet.publicKey,
                        signature: wallet.sign(evilOutputMap)
                    },
                    outputMap: evilOutputMap
                }

                newChain.addBlock({ data: [evilTransaction] })

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
            })
        })

        describe('and a block contains multipe identical transactions', () => {
            it('returns false', () => {
                newChain.addBlock({ data: [transaction, transaction] })

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
            })
        })
    })
})