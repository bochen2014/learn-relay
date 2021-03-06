import React, { Component } from 'react'
import Relay from 'react-relay/classic'

import increamentCounter from '../../mutation/increamentCounterMutation'
import Person from './Person'


class SearchContainer extends Component {
    constructor() {
        super()
        this.state = {
            selectedStatus: 'any'
        }
    }
    _onMutate = event => {
        const { relay, viewer } = this.props
        relay.commitUpdate(
            /* the Mutation expects the prop passed in has a fragment called 'viewer' (defined in its fragment builder) defined; otherwise Relay will throw an warning (anti pattern) */
            // if you don't pass in a fragment container that contains the fragment defined in `person`'s fragment builder, you get the same warning 
            new increamentCounter({ viewer: viewer })
        )
    }

    _displayPendingMutation = () => {
        const { viewer, relay } = this.props
        const transactions = relay.getPendingTransactions(viewer)
        let hasPendingTrx = transactions && transactions.length > 0
        const hasOptimisticUpdate = relay.hasOptimisticUpdate(viewer)
        //console.log(` hading pending transaction? ${hasPendingTrx}  --- hasOptimisticUpdate ? ${hasOptimisticUpdate}  ; most of the time , they should be synchronized`)
        if (hasPendingTrx) {
            return <h2>
                mutation-> send request -> get response ->
                    StoreChange ---> GraphQLStoreChangeEmitter::_processSubscriber -> GraphQLStoreSingleQueryResolver::_handleChange -> RelayContainer._handleFragmentDataUpdate
                </h2>
        }
    }

    _displayPendingQuery = () => {
        const { variables: { status }, pendingVariables } = this.props.relay
        if (pendingVariables && 'status' in pendingVariables) { // 'a' in {a:'1'} returns true
            return <h2>RelayContainer.setVariables()=> this.context.relay.environment.primeCache(callback= relayContainer.onReadyStateChange) =>
                        StoreData.getQueryRunner => GraphqlQueryRunner.run => GraphqlQueryRunner.runQueryies => RelayNetworkLayer...</h2>

        }
    }

    onStatusChange = (event) => {
        const { value } = event.target;
        this.setState({
            selectedStatus: value,
        })

        // !! I could have 2 children <div> <Person /> <Person/> </div>
        // each <Person /> could have different fragment variables;
        //     remember Query is static, a Query contains fragment which is also static; but fragment variables is per instance
        // now when parent start calling setVariables, and because its fragment referenced child fragment, we need to work out child variables
        // but we couldn't becuase we have 2 different ones
        // that's why parent has to override child variables , but this is only to be limited to the case where parent has choosen to do Fragment Override
        // more, see: https://github.com/facebook/relay/issues/1138
        this.props.relay.setVariables({
            status: value,
        })
    }

    isLoading1 = () => {
        const { selectedStatus } = this.state;
        const { variables: { status: fragmentStatus } } = this.props.relay;
        return selectedStatus !== fragmentStatus;
    }

    isLoading2 = () => {
        const { relay: { variables, pendingVariables } } = this.props
        return !!pendingVariables && 'status' in pendingVariables; // 'a' in {a:'1'} returns true
    }

    render() {
        const { viewer, viewer: { counter }, relay } = this.props

        // shouldn't use this.state.selectedStatus as that could being fetched; not ready yet;
        const { selectedStatus } = this.state;
        const { variables: { status: fragmentStatus } } = this.props.relay;
        return (<div>
            <div style={{ marginTop: 40 }}>
                {/* handle mutation*/}
                {this._displayPendingMutation()}
                <div>counter:{counter}</div>
                <button onClick={this._onMutate.bind(this)} >Mutation</button>
            </div>

            <div style={{ marginTop: 40, borderTop: 'solid 1px grey' }}>
                {this._displayPendingQuery()}
                <div>
                    <select name='person_filter_dp'
                        value={selectedStatus}
                        onChange={this.onStatusChange} >
                        <option value='any'>Any</option>
                        <option value='open'>Open</option>
                        <option value='in_progress'>In Progress</option>
                        <option value='passed'>Passed</option>
                    </select>
                </div>
                {this.isLoading2() ? <h2>loading...</h2>
                    : <Person viewer={viewer} status={fragmentStatus} />}

            </div>
        </div>)
    }
}

export default Relay.createContainer(SearchContainer, {
    initialVariables: {
        status: 'invalidxxx' // to be overidden by react-router
    },
    fragments: {
        viewer: (variables) => Relay.QL`
            fragment on Viewer {
                counter,
                ${increamentCounter.getFragment('viewer')}
                ${Person.getFragment('viewer', variables)} 
            }`
    }
})
