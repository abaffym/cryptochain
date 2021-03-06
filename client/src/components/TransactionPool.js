import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Transaction from './Transaction'
import history from '../history'

const POLL_INTERVAL_MS = 10_000

class TransactionPool extends Component {
    state = { transactionPoolMap: {} }

    fetchTransactionMap = () => {
        fetch(`${document.location.origin}/api/transaction-pool-map`)
            .then(response => response.json())
            .then(json => this.setState({ transactionPoolMap: json }))
    }

    fetchMineTransactions = () => {
        fetch(`${document.location.origin}/api/mine-transactions`)
            .then(response => {
                if(response.status === 200) {
                    alert('success')
                    history.push("/blocks")
                } else {
                    alert('error')
                }
            })
    }

    componentDidMount() {
        this.fetchTransactionMap()

        this.fetchPoolMapInterval = setInterval(
            () => this.fetchTransactionMap(),
            POLL_INTERVAL_MS
        )
    }

    componentWillUnmount() {
        clearInterval(this.fetchPoolMapInterval)
    }

    render() {
        return (
            <div className='TransactionPool'>
                <Link to='/'>Home</Link>
                <h3>Transaction Pool</h3>
                {
                    Object.values(this.state.transactionPoolMap).map(transaction => {
                        console.log(transaction)
                        return <div key={transaction.id}>
                            <hr></hr>
                            <Transaction transaction={transaction}></Transaction>
                        </div>
                    })
                }
                <br />
                <Button
                    bsStyle="danger"
                    onClick={this.fetchMineTransactions}
                >Mine the Transactions</Button>
            </div>
        )
    }

}

export default TransactionPool