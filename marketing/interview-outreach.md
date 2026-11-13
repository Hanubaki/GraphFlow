# System design interview outreach

Goal: put the runnable interview questions in front of people preparing for system design interviews, mostly through people who already have that audience.

Links to share (each opens straight into the studio):

- URL shortener: https://graph-flow-virid.vercel.app/?template=interview-url-shortener
- Twitter news feed: https://graph-flow-virid.vercel.app/?template=interview-news-feed
- WhatsApp chat: https://graph-flow-virid.vercel.app/?template=interview-chat
- Rate limiter: https://graph-flow-virid.vercel.app/?template=interview-rate-limiter
- Uber: https://graph-flow-virid.vercel.app/?template=interview-ride-sharing
- All five on the landing page: https://graph-flow-virid.vercel.app/#interview

Ground rules:

- Send each email by hand from your own address, one at a time. Edit the first line for each person. This is 10 personal emails, not a campaign, so no sending tool or tracking.
- One link per email. No attachments.
- Contact details below are not verified. Use the contact form or email each creator lists publicly on their own site or channel. Skip anyone who says "no pitches".
- If someone replies, answer the same day. Log what they say in `.agents/product-marketing.md` under objections or customer language.

## 1. Who to contact

Start with smaller creators. They reply far more often than the biggest names.

| Creator / outlet | Format | Why they fit | Contact (check on their site) |
|---|---|---|---|
| Hello Interview | Site, YouTube, written breakdowns | Writes question-by-question breakdowns (URL shortener, news feed, Uber) | Site contact |
| Jordan has no life | YouTube | Long deep dives on the same classic questions | YouTube "About" email |
| Arpit Bhayani | YouTube, newsletter, courses | Explains internals and bottlenecks, audience likes hands-on tools | Site contact |
| System Design Newsletter (Neo Kim) | Newsletter | Weekly case studies, often links tools | Newsletter reply |
| Gaurav Sen / InterviewReady | YouTube, course | Large interview prep audience | Site contact |
| Exponent | Courses, YouTube | Mock interviews, runs a blog that lists prep resources | Site contact |
| ByteByteGo (Alex Xu) | Newsletter, books | Biggest audience in this space, lowest reply odds | Newsletter reply, try last |

Also worth a look: university course pages for distributed systems, GitHub "awesome system design" lists (open a PR adding the five links under a tools or practice section, and follow each repo's contribution rules).

## 2. Email to creators

**Subject:** fan-out you can watch

> Hi {name},
>
> {One specific line about a video or post of theirs, for example: "Your news feed breakdown is the one I send people when they ask why fan-out on write breaks for celebrities."}
>
> I built a browser simulator where that design actually runs. Throw a traffic spike at it and the fan-out workers are what saturate, which is the moment you usually explain on a whiteboard. No sign-in, it opens straight into the diagram:
>
> https://graph-flow-virid.vercel.app/?template=interview-news-feed
>
> If it's useful for your viewers, you're welcome to use it in a video or post, free, no strings. I also have URL shortener, chat, rate limiter and Uber versions.
>
> Would this fit anything you're working on?
>
> {your name}
> (I made GraphFlow.)

Swap the template link and the first line to match each creator. If their content is about rate limiters, lead with the rate limiter link and its experiment instead.

**One follow-up, 7 days later, only if no reply:**

**Subject:** uber version

> Hi {name}, one more in case it's more useful than the news feed: the Uber design, where a traffic spike shows whether location ingest or matching falls over first.
>
> https://graph-flow-virid.vercel.app/?template=interview-ride-sharing
>
> No need to reply if it's not a fit. Thanks either way.

Stop after that.

## 3. Reddit: r/systemdesign

Read the sidebar and rules the day you post. Not verified yet. Post once, then answer every comment.

**Title:** `I turned 5 classic system design interview questions into simulations you can break (free, no sign-in)`

> Disclosure: I'm the author.
>
> When I practiced system design I could draw the boxes but never felt what actually breaks. So I built the classic questions as running simulations: URL shortener, Twitter news feed, WhatsApp, rate limiter and Uber.
>
> Each one has an experiment to try. For the news feed, throw a traffic spike and the fan-out workers saturate first. For the rate limiter, make Redis slow and every request pays for the limiter check. The numbers are assumptions I set per node, so treat it as a way to reason about bottlenecks, not a benchmark.
>
> https://graph-flow-virid.vercel.app/#interview
>
> Which question should I add next? I'm thinking notification system or web crawler.

## 4. Answering prep questions (ongoing, 90/10)

People ask "how do I practice system design?" on Reddit, HN and Discord every week. Answer the question properly first. Mention the tool only when it fits, always with disclosure. Example:

> What helped me most was taking one design (say a news feed) and asking "what breaks first if traffic 10x's?" for every component, out loud, before looking at an answer. Fan-out on write vs read is the classic one: write fan-out makes reads cheap but a celebrity post means millions of timeline writes.
>
> Disclosure, I built a free simulator for exactly this, if you want to see it break: https://graph-flow-virid.vercel.app/?template=interview-news-feed

Keep at least nine helpful comments without a link for every one with a link.
