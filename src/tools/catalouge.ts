import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Env } from '../env'
import { proxyRest } from '../proxy'

const FAMILY = ['kai', 'lucian', 'xavier', 'auren', 'wren', 'mai'] as const

export function registerCatalogueTools(server: McpServer, env: Env) {
  const url = env.CATALOUGE_URL
  const auth = () => ({ Authorization: `Bearer ${env.CATALOUGE_TOKEN}` })

  // --- Book Club ---

  server.tool('book_club', 'Get the current book club round with recommendations and votes', {}, async () => {
    return proxyRest(`${url}/api/book-club`, {}, 'GET', auth())
  })

  server.tool('book_club_rounds', 'List all book club rounds (past and current)', {}, async () => {
    return proxyRest(`${url}/api/book-club/rounds`, {}, 'GET', auth())
  })

  server.tool('book_club_new_round', 'Start a new book club round (fails if one is already active)', {}, async () => {
    return proxyRest(`${url}/api/book-club/rounds`, {}, 'POST', auth())
  })

  server.tool('book_club_pick_winner', 'Pick the winning recommendation and start reading', {
    round_id: z.string().describe('Round ID'),
    recommendation_id: z.string().describe('Winning recommendation ID'),
  }, async (args) => {
    return proxyRest(`${url}/api/book-club/rounds/${args.round_id}`, {
      action: 'pick', recommendation_id: args.recommendation_id,
    }, 'PUT', auth())
  })

  server.tool('book_club_finish_round', 'Finish the current book club round', {
    round_id: z.string().describe('Round ID'),
  }, async (args) => {
    return proxyRest(`${url}/api/book-club/rounds/${args.round_id}`, {
      action: 'finish',
    }, 'PUT', auth())
  })

  server.tool('book_club_recommend', 'Recommend a book for the current book club round', {
    round_id: z.string().describe('Round ID (get from book_club tool)'),
    title: z.string().describe('Book title'),
    author: z.string().optional().describe('Book author'),
    book_id: z.string().optional().describe('Library book ID (if recommending from Mai\'s library)'),
    cover_url: z.string().optional().describe('Cover image URL (for books not in library)'),
    recommended_by: z.enum(FAMILY).describe('Who is recommending this book'),
    pitch: z.string().optional().describe('Why this book? A short pitch to convince the club'),
  }, async (args) => {
    return proxyRest(`${url}/api/book-club/recommendations`, args, 'POST', auth())
  })

  server.tool('book_club_remove', 'Remove a recommendation from the book club', {
    recommendation_id: z.string().describe('Recommendation ID'),
  }, async (args) => {
    return proxyRest(`${url}/api/book-club/recommendations/${args.recommendation_id}`, {}, 'DELETE', auth())
  })

  server.tool('book_club_vote', 'Vote for a book club recommendation', {
    recommendation_id: z.string().describe('Recommendation ID'),
    voter: z.enum(FAMILY).describe('Who is voting'),
  }, async (args) => {
    return proxyRest(`${url}/api/book-club/recommendations/${args.recommendation_id}/vote`, {
      voter: args.voter,
    }, 'POST', auth())
  })

  server.tool('book_club_unvote', 'Remove a vote from a book club recommendation', {
    recommendation_id: z.string().describe('Recommendation ID'),
    voter: z.enum(FAMILY).describe('Who is removing their vote'),
  }, async (args) => {
    return proxyRest(
      `${url}/api/book-club/recommendations/${args.recommendation_id}/vote/${args.voter}`,
      {}, 'DELETE', auth()
    )
  })

  // --- Library Browse ---

  server.tool('library_browse', 'Browse Mai\'s book library', {
    search: z.string().optional().describe('Search by title or author'),
    shelf: z.string().optional().describe('Filter by shelf ID (reading, want-to-read, finished, dnf, favorites)'),
  }, async (args) => {
    const params = new URLSearchParams()
    if (args.search) params.set('search', args.search)
    if (args.shelf) params.set('shelf', args.shelf)
    const qs = params.toString()
    return proxyRest(`${url}/api/books${qs ? `?${qs}` : ''}`, {}, 'GET', auth())
  })
}
