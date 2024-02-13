import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
type Review {
  id: ID!
  rating: Int!
  content: String!
  game: Game!
  author: Author!
}

type Game {
  id: ID!
  title: String! @deprecated(reason: "Old field this is")
  name: String!
  platforms: [String!]!
  reviews: [Review!]
}

type Author {
  id: ID!
  name: String!
  verified: Boolean!
  reviews: [Review!]
}

type Query {
  reviews: [Review]
  review(id: ID!): Review
  game(id: ID!): Game
  author(id: ID!): Author
  games: GamesResults
  authors: [Author]
}

type Mutation {
  deleteGame(id: ID!): [Game]
  addGame(game: AddGameInput!): Game
  updateGame(id: ID!, edits: EditGameInput!): Game
}

input AddGameInput {
  title: String!
  platforms: [String!]
}

input EditGameInput {
  title: String
  platforms: [String!]
}

type GameSuccessResults {
  games: [Game]
}

type GameErrorResults {
  errors: [Error!]!
}

type Error {
  message: String!
}

union GamesResults = GameSuccessResults | GameErrorResults
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

let games = [{id: '1', title: 'golden ratio', name: "golden ratio new", platforms: ['twitch']}, {id: '2', title: 'golden ratio 11', name: "golden ratio new2", platforms: ['twitch']}]
let authors = [{id: '1', name: 'mario', verified: true}]
let reviews = [{id: '1', rating: 9, content: 'something', author_id: '1', game_id: '1'}]

const resolvers = {
  Query: {
    games: (_, args, context, info) => {
      if (games) {
        return {games: games}
      } else {
        return {errors: [{message: "Error happened"}]}
      }
      
    },
    reviews: () => reviews,
    authors: () => authors,
    review: (_, args) => {
      let id = args.id
      return reviews.find((review) => review.id == id)
    },
    game: (_, args, context, info) => {
      let id = args.id
      return games.find((game) => game.id == id)
    },
    author: (_, args) => {
      let id = args.id
      return authors.find((author) => author.id == id)
    }
  },
  Game: {
    reviews: (parent) => {
      console.log(parent)
      return reviews.filter((review) => review.game_id == parent.id)
    }
  },
  Author: {
    reviews: (parent) => {
      console.log(parent)
      return reviews.filter((review) => parent.id == review.author_id) 
    }
  },
  Review: {
    game: (parent, args, context, info) => {
      console.log(args)
      return games.find((game) => game.id == parent.game_id)
    },
    author: (parent) => {
      return authors.find((author) => author.id == parent.author_id)
    }
  },
  GamesResults: {
    __resolveType(obj) {
      if (obj.games) {
        return "GameSuccessResults"
      } else {
        return "GameErrorResults"
      }
    }
  },
  Mutation: {
    deleteGame: (_, args) => {
      let id = args.id
      games = games.filter((game) => game.id != id)
      return games
    },
    addGame: (_, args, context, info) => {
      console.log(context)
      let id = games.length + 1
      let game = {id: id.toString(), title: args.game.title, platforms: args.game.platforms, name: args.game.name}
      //let game = {...args.game, id: id}
      games.push(game)
      return game
    },
    updateGame: (_, args) => {
      games = games.map((game) => {
        console.log("hahah")
        if (game.id == args.id) {
          return {...game, ...args.edits}
        }
        return game
      })
      console.log(games)
      return games.find((game) => game.id == args.id)
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
});

const { url } = await startStandaloneServer(server, {
  context: async (metadata) => ({
    "name": "jayesh", "lastName": "kawli", "metadata": metadata
  }),
  listen: { port: 4000 }
});

console.log(`server ready at ${url}`)