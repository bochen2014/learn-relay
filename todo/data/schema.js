/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only.  Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  cursorForObjectInConnection,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
  toGlobalId,
} from 'graphql-relay';

import {
  Todo,
  User,
  addTodo,
  changeTodoStatus,
  getTodo,
  getTodos,
  getUser,
  getViewer,
  markAllTodos,
  removeCompletedTodos,
  removeTodo,
  renameTodo,
} from './database';

//system way
//const {type, id} = fromGlobalId('Tfjs678==')


/**
 * Takes a type name and an ID specific to that type name, and returns a
 * "global ID" that is unique among all types.
function MyClass(){
  this.val='bchen
  this.test=function(){
    this.sayHello() 
    (0,this.sayHello) //undefined   detach function from its
  }
}
(0, )
function toGlobalId(type, id) {
  return (0, _base.base64)([type, id].join(':'));
}

*/
//const globalID = toGlobalId('Todo','123')
//unibet way:
const fromGlobalId_unibet = (globalId) => {
  const [type, id] = globalId.split(':')
  return {
    type, id
  }
}
const toGlobalId_unitbet = (typeStr, id) => [typeStr, id].join(':')

/******************************************************** */
// the purpose of nodeDefinitions is for relay to be able to get a node based on globalId 
// two steps: 1. get an object via idFetcher(globalId)
//            2. get the GraphQLObjectType of the object, then compare with the query, or simple build __typename;
//               if GraphQLObjectType doesn't match query type, throw error
/*
{node(id:"VG9kbzox"){
  __typename
}}
------>
{
  "data": {
    "node": {   // via idFetcher
      "__typename": "Todo"  //via typeResolver
    }
  }
}
 */
const { nodeInterface, nodeField } = nodeDefinitions(
  // idFetcher
  (globalId) => {
    const { type, id } = fromGlobalId_unibet(globalId);
    console.log(`get node from node id#${type + ':' + id}`)
    if (type === 'Todo') {
      return getTodo(id);
    } else if (type === 'User') {
      return getUser(id);
    }
    return null;
  },
  //type resolver
  // we need type resolver because `node` is a base type, we can't query on a node type
  // graphql needs to know what GraphQLObjectType the current object returned by idFetcher is, 
  // to be able to provide query intellisense , type check...etc
  // { node (id:"VmlkZW86Yg=="){ id, __typename, ... on Todo{ text, complete}}}
  (obj) => {
    if (obj instanceof Todo) {
      return GraphQLTodo; { { } }
    } else if (obj instanceof User) {
      return GraphQLUser;
    }
    return null;
  }
);
/******************************************************** */
const CompetitorType = new GraphQLObjectType({
  name: 'Competitor',
  description: 'horse',

  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),   //note: you MUST use  GraphQLID, not ANYTHINGELSE!
      resolve: obj => toGlobalId_unitbet('Competitor', obj.id)
    },
    name: {
      type: GraphQLString
    },
    saddleNumber: {
      type: GraphQLInt
    },
    eventId: {
      type: GraphQLString
    },
    suspended: {
      type: GraphQLBoolean
    }
  }
})


const GraphQLTodo = new GraphQLObjectType({
  name: 'Todo',
  description: '...',


  fields: {
    //standard way:
    //id: globalIdField('Todo'),
    //unibet way:
    id: {
      type: new GraphQLNonNull(GraphQLID),   //note: you MUST use  GraphQLID, not ANYTHINGELSE!
      resolve: obj => toGlobalId_unitbet('Todo', obj.id)
    },

    origId: {
      type: GraphQLInt,
      resolve: (obj) => obj.id
    },

    text: {
      type: GraphQLString,
      resolve: (obj) => obj.text,
    },

    complete: {
      type: GraphQLBoolean,
      resolve: (obj) => obj.complete,
    },
    summary: {
      type: GraphQLString,
      resolve: obj => obj.text + '__summary'
    },
    details: {
      type: GraphQLString,
      resolve: obj => obj.text + '__details'
    },
    competitors: {
      type: new GraphQLList(CompetitorType),
      // http://graphql.org/learn/execution/#root-fields-resolvers
      resolve: (objct, args, context) => {
        return [{
          id: 1,
          name: 'horse#1',
          saddleNumber: 1,
          eventId: 'event:1',
          suspended: false
        }, {
          id: 2,
          name: 'horse#2',
          saddleNumber: 2,
          eventId: 'event:1',
          suspended: true
        }]
      }
    }
  },
  interfaces: [nodeInterface],
});

//TodoConnection  definition
const {
      connectionType: TodosConnection,
  edgeType: GraphQLTodoEdge,
    } = connectionDefinitions({  // same as GraphQLList(GraphQLTodo), just wrap the list in `edges`
    name: 'Todo',
    nodeType: GraphQLTodo,
    connectionFields: () => ({
      // a connection type by default has 'edges' and 'pageInfo' fields
      // now we are adding the third one, which is a custom one;
      totalCount: {
        type: GraphQLInt,
        description: ' a custom connection field. will be defined at connectionType level',
        resolve: (connection) => {
          return connection.edges.length;
        }
      }
    })
  });

//user defination
const GraphQLUser = new GraphQLObjectType({
  name: 'User',
  fields: {
    //standard way:
    // id: globalIdField('User'),
    //unibet way:
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: obj => toGlobalId_unitbet('User', obj.id)
    },

    todos: {
      type: TodosConnection,
      ///**************************************************************************************/
      // here is a prime example of how you extend an object
      // Object.assign({}, obj, {newProp: value}) , or simply {...obj, newProp: value}
      args: {
        status: {
          type: GraphQLString,
          defaultValue: 'any',
        },
        id: {
          type: GraphQLInt
        },
        ...connectionArgs,  //todos(after: 1, first: 2, before: 3, last: 4) {...}
      },
      ///**************************************************************************************/
      // also , as a convention, if you don't need an arg in the funtion signature, name it '_'
      // what are the parameters of resolve? http://graphql.org/learn/execution/#root-fields-resolvers
      resolve: (_, { status, id, ...args }) =>

        new Promise(resovle => {
          setTimeout(function () {
            //console.log(`getTodos for status:${status} and id:${id||'undefined'} retuns ${JSON.stringify(result)}`)
            const result = getTodos(status, id)
            resovle(connectionFromArray(result, args))
          }, 1 * 1000)
        })
    },
    totalCount: {
      type: GraphQLInt,
      resolve: () => getTodos().length,
    },
    completedCount: {
      type: GraphQLInt,
      resolve: () => getTodos('completed').length,
    },
  },
  interfaces: [nodeInterface],
});

const Root = new GraphQLObjectType({
  name: 'Root',
  fields: {
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
    node: nodeField,
  },
});

//****************************************   MUTATION   ************************************************************************** */

const GraphQLAddTodoMutation = mutationWithClientMutationId({
  name: 'AddTodo',
  inputFields: {
    text: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    todoEdge: {
      type: GraphQLTodoEdge,
      resolve: ({ localTodoId }) => {
        const todo = getTodo(localTodoId);
        return {
          cursor: cursorForObjectInConnection(getTodos(), todo),
          node: todo,
        };
      },
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: ({ text }) => {
    const localTodoId = addTodo(text);
    return { localTodoId };
  },
});

const GraphQLChangeTodoStatusMutation = mutationWithClientMutationId({
  name: 'ChangeTodoStatus',
  inputFields: {
    complete: { type: new GraphQLNonNull(GraphQLBoolean) },
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    todo: {
      type: GraphQLTodo,
      resolve: ({ localTodoId }) => getTodo(localTodoId),
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: ({ id, complete }) => {
    const localTodoId = fromGlobalId_unibet(id).id;
    changeTodoStatus(localTodoId, complete);
    return { localTodoId };
  },
});

const GraphQLMarkAllTodosMutation = mutationWithClientMutationId({
  name: 'MarkAllTodos',
  inputFields: {
    complete: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
  outputFields: {
    changedTodos: {
      type: new GraphQLList(GraphQLTodo),
      resolve: ({ changedTodoLocalIds }) => changedTodoLocalIds.map(getTodo),
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: ({ complete }) => {
    const changedTodoLocalIds = markAllTodos(complete);
    return { changedTodoLocalIds };
  },
});

// TODO: Support plural deletes
const GraphQLRemoveCompletedTodosMutation = mutationWithClientMutationId({
  name: 'RemoveCompletedTodos',
  outputFields: {
    //outputFields gets its source data from mutateAndGetPayload
    deletedTodoIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ deletedTodoIds }) => deletedTodoIds,
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: () => {
    const deletedTodoLocalIds = removeCompletedTodos();
    const deletedTodoIds = deletedTodoLocalIds.map(toGlobalId_unitbet.bind(null, 'Todo'));
    return { deletedTodoIds };
  },
});

const GraphQLRemoveTodoMutation = mutationWithClientMutationId({
  name: 'RemoveTodo',
  inputFields: {
    //inputFields gets its source data fom client Mutation class's setVariables()
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    deletedTodoId: {
      type: GraphQLID,
      resolve: ({ id }) => id,
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: ({ id }) => {
    const localTodoId = fromGlobalId_unibet(id).id;
    removeTodo(localTodoId);
    return { id };
  },
});

const GraphQLRenameTodoMutation = mutationWithClientMutationId({
  name: 'RenameTodo',
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    text: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    todo: {
      type: GraphQLTodo,
      resolve: ({ localTodoId }) => getTodo(localTodoId),
    },
  },
  mutateAndGetPayload: ({ id, text }) => {
    const localTodoId = fromGlobalId_unibet(id).id;
    renameTodo(localTodoId, text);
    return { localTodoId };
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addTodo: GraphQLAddTodoMutation,
    changeTodoStatus: GraphQLChangeTodoStatusMutation,
    markAllTodos: GraphQLMarkAllTodosMutation,
    removeCompletedTodos: GraphQLRemoveCompletedTodosMutation,
    removeTodo: GraphQLRemoveTodoMutation,
    renameTodo: GraphQLRenameTodoMutation,
  },
});


export const schema = new GraphQLSchema({
  query: Root,
  mutation: Mutation,
});
