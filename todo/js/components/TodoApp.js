import AddTodoMutation from '../mutations/AddTodoMutation';
import TodoListFooter from './TodoListFooter';
import TodoTextInput from './TodoTextInput';

import React, { Component, PropTypes } from 'react';
import Relay from 'react-relay';

class TodoApp extends React.Component {

  static contextTypes = {
    relay: PropTypes.object
  }

  _printStore = () => {
    console.log(this.context.relay._storeData)
  }

  _handleTextInputSave = (text) => {
    this.props.relay.commitUpdate(
      new AddTodoMutation({ text, viewer: this.props.viewer })
    );
  };

  render() {
    const hasTodos = this.props.viewer.totalCount > 0;
    return (
      <div>
        <button style={{position:'absolute', top:'0', right:'0'}} 
                onClick={this._printStore} >printStore</button>
        <section className="todoapp">
          <header className="header">
            <h1>
              App Header -- defined in {'<App>'}
            </h1>
            <TodoTextInput
              autoFocus={true}
              className="new-todo"
              onSave={this._handleTextInputSave}
              placeholder="What needs to be done?"
            />
          </header>

          {this.props.children}

          {hasTodos &&
            <TodoListFooter
              todos={this.props.viewer.todos}
              viewer={this.props.viewer}
            />
          }


        </section>

      </div>
    );
  }
}

export default Relay.createContainer(TodoApp, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        totalCount,
        ${AddTodoMutation.getFragment('viewer')},
        ${TodoListFooter.getFragment('viewer')},
      }
    `,
  },
});
