const TransactionPool = require('./transaction-pool')
const Transaction = require('./transaction')
const Wallet = require('./index')
const Blockchain = require('../blockchain')
const e = require('express')

describe('TransactionPool', () => {
    let transactionPool, transaction

    beforeEach(() => {
        transactionPool = new TransactionPool()
        senderWallet = new Wallet()
        transaction = new Transaction({
            senderWallet,
            recipient: 'fake-recipient',
            amount: 50
        })
    })

    describe('setTransaction()', () => {
        it('adds a transaction', () => {
            transactionPool.setTransaction(transaction)
            expect(transactionPool.transactionMap[transaction.id])
                .toBe(transaction)
        })
    })

    describe('validTransaction()', () => {
        let validTransactions, errorMock


        beforeEach(() => {
            validTransactions = []
            errorMock = jest.fn()
            global.console.error = errorMock

            for (let i = 0; i < 10; i++) {
                transaction = new Transaction({
                    senderWallet, recipient: 'foo-recipient', amount: 30
                })

                if (i % 3 === 0) {
                    transaction.input.amount = 9999999
                } else if (i % 3 === 1) {
                    transaction.input.signature = new Wallet().sign('foo')
                } else {
                    validTransactions.push(transaction)
                }

                transactionPool.setTransaction(transaction)
            }
        })

        it('returns valid transactions', () => {
            expect(transactionPool.validTransactions()).toEqual(validTransactions)
        })
    })

    describe('clear()', () => {
        it('clears the transactions', () => {
            transactionPool.clear()

            expect(transactionPool.transactionMap).toEqual({})
        })
    })

    describe('clearBlockchainTransactions()', () => {
        it('clears the pool of any existing blockchain transactions', () => {
            const blockchain = new Blockchain()
            const expectedTransactionsMap = {}

            for (let i = 0; i < 6; i++) {
                const transaction = new Wallet().createTransaction({
                    recipient: 'foo-recipient', amount: 30
                })

                transactionPool.setTransaction(transaction)

                if (i % 2 === 0) {
                    blockchain.addBlock({ data: [transaction] })
                } else {
                    expectedTransactionsMap[transaction.id] = transaction
                }

            }

            transactionPool.clearBlockchainTransactions({ chain: blockchain.chain })
            expect(transactionPool.transactionMap).toEqual(expectedTransactionsMap)
        })
    })
})
