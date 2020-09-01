// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/graphql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BindingKey, Constructor} from '@loopback/core';
import {AuthChecker, ResolverData} from 'type-graphql';
import {GraphQLComponent} from './graphql.component';
import {ContextFunction, ExpressContext, GraphQLServer} from './graphql.server';

export namespace GraphQLBindings {
  export const GRAPHQL_SERVER = BindingKey.create<GraphQLServer>(
    'servers.GraphQLServer',
  );

  export const COMPONENT = BindingKey.create<GraphQLComponent>(
    'components.GraphQLComponent',
  );

  export const GRAPHQL_CONTEXT_RESOLVER = BindingKey.create<
    ContextFunction<ExpressContext>
  >('graphql.contextResolver');

  export const GRAPHQL_AUTH_CHECKER = BindingKey.create<AuthChecker>(
    'graphql.authChecker',
  );

  export const RESOLVER_DATA = BindingKey.create<ResolverData<unknown>>(
    'graphql.resolverData',
  );

  export const RESOLVER_CLASS = BindingKey.create<Constructor<unknown>>(
    'graphql.resolverClass',
  );

  export const RESOLVERS = 'resolvers';
}

export namespace GraphQLTags {
  export const GRAPHQL = 'graphql';
  export const RESOLVER = 'graphql.resolver';
  export const MIDDLEWARE = 'graphql.middleware';
}
