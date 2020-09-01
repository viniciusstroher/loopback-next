// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/graphql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  Binding,
  BindingKey,
  BindingScope,
  config,
  Constructor,
  Context,
  ContextTags,
  createBindingFromClass,
  filterByTag,
  inject,
  lifeCycleObserver,
  Server,
} from '@loopback/core';
import {HttpOptions, HttpServer} from '@loopback/http-server';
import {ContextFunction} from 'apollo-server-core';
import {ApolloServer, ApolloServerExpressConfig} from 'apollo-server-express';
import {ExpressContext} from 'apollo-server-express/dist/ApolloServer';
import express from 'express';
import {
  AuthChecker,
  buildSchema,
  NonEmptyArray,
  ResolverInterface,
} from 'type-graphql';
import {Middleware} from 'type-graphql/dist/interfaces/Middleware';
import {LoopBackContainer} from './graphql.container';
import {GraphQLBindings, GraphQLTags} from './keys';

export {ContextFunction} from 'apollo-server-core';
export {ApolloServerExpressConfig} from 'apollo-server-express';
export {ExpressContext} from 'apollo-server-express/dist/ApolloServer';

/**
 * Options for GraphQL server
 */
export interface GraphQLServerOptions extends HttpOptions {
  /**
   * GraphQL related configuration
   */
  graphql?: ApolloServerExpressConfig;
  /**
   * Express settings
   */
  express?: Record<string, unknown>;
  /**
   * Use as a middleware for RestServer instead of a standalone server
   */
  asMiddlewareOnly?: boolean;
}

/**
 * GraphQL Server
 */
@lifeCycleObserver('server', {
  scope: BindingScope.SINGLETON,
  tags: {[ContextTags.KEY]: GraphQLBindings.GRAPHQL_SERVER},
})
export class GraphQLServer extends Context implements Server {
  readonly httpServer?: HttpServer;
  readonly expressApp: express.Application;

  constructor(
    @config() private options: GraphQLServerOptions = {},
    @inject.context()
    parent?: Context,
  ) {
    super(parent, 'graphql-server');
    this.expressApp = express();
    if (options.express) {
      for (const p in options.express) {
        this.expressApp.set(p, options.express[p]);
      }
    }

    if (!options.asMiddlewareOnly) {
      this.httpServer = new HttpServer(this.expressApp, this.options);
    }
  }

  getResolvers(): Constructor<ResolverInterface<object>>[] {
    const view = this.createView(filterByTag(GraphQLTags.RESOLVER));
    return view.bindings
      .filter(b => b.valueConstructor != null)
      .map(b => b.valueConstructor as Constructor<ResolverInterface<object>>);
  }

  async getMiddlewares(): Promise<Middleware<unknown>[]> {
    const view = this.createView<Middleware<unknown>>(
      filterByTag(GraphQLTags.MIDDLEWARE),
    );
    return view.values();
  }

  middleware(middleware: Middleware<unknown>): Binding<Middleware<unknown>> {
    return this.bind<Middleware<unknown>>(
      BindingKey.generate(`graphql.middleware`),
    )
      .to(middleware)
      .tag(GraphQLTags.MIDDLEWARE);
  }

  resolver(resolverClass: Constructor<ResolverInterface<object>>) {
    return registerResolver(this, resolverClass);
  }

  async start() {
    const resolverClasses = (this.getResolvers() as unknown) as NonEmptyArray<
      Function
    >;

    const authChecker: AuthChecker =
      (await this.get(GraphQLBindings.GRAPHQL_AUTH_CHECKER, {
        optional: true,
      })) ?? ((resolverData, roles) => true);

    // build TypeGraphQL executable schema
    const schema = await buildSchema({
      // See https://github.com/MichalLytek/type-graphql/issues/150#issuecomment-420181526
      validate: false,
      resolvers: resolverClasses,
      // automatically create `schema.gql` file with schema definition in current folder
      // emitSchemaFile: path.resolve(__dirname, 'schema.gql'),
      container: new LoopBackContainer(this),
      authChecker,
      globalMiddlewares: await this.getMiddlewares(),
    });

    // Allow a graphql context resolver to be bound to GRAPHQL_CONTEXT_RESOLVER
    const graphqlContextResolver: ContextFunction<ExpressContext> =
      (await this.get(GraphQLBindings.GRAPHQL_CONTEXT_RESOLVER, {
        optional: true,
      })) ?? (context => context);

    const serverConfig: ApolloServerExpressConfig = {
      // enable GraphQL Playground
      playground: true,
      context: graphqlContextResolver,
      ...this.options.graphql,
      schema,
    };
    // Create GraphQL server
    const graphQLServer = new ApolloServer(serverConfig);

    graphQLServer.applyMiddleware({app: this.expressApp});

    await this.httpServer?.start();
  }

  async stop() {
    await this.httpServer?.stop();
  }

  get listening() {
    return !!this.httpServer?.listening;
  }
}

export function registerResolver(
  ctx: Context,
  resolverClass: Constructor<object>,
): Binding {
  const binding = createBindingFromClass(resolverClass, {
    namespace: GraphQLBindings.RESOLVERS,
  }).tag(GraphQLTags.RESOLVER);
  ctx.add(binding);
  return binding;
}
