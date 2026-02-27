import React from 'react'

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readingTime: string
  keywords: string[]
  content: React.ReactNode
}

const articleStyles = {
  paragraph: {
    fontSize: '1.125rem',
    lineHeight: 1.8,
    color: '#333',
    margin: '0 0 24px',
  } as React.CSSProperties,
  h2: {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '48px 0 16px',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,
  h3: {
    fontSize: '1.35rem',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '36px 0 12px',
  } as React.CSSProperties,
  blockquote: {
    borderLeft: '3px solid #f26522',
    paddingLeft: 20,
    margin: '32px 0',
    fontStyle: 'italic' as const,
    color: '#555',
    fontSize: '1.125rem',
    lineHeight: 1.7,
  } as React.CSSProperties,
  bold: {
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'increase-app-conversion-rate',
    title: 'How to Increase Your App\'s Conversion Rate',
    description: 'Most apps lose the majority of users before they even see the core product. Here is what actually moves the needle on conversion, and why your onboarding flow is the biggest lever you are not pulling.',
    date: '2025-02-20',
    readingTime: '6 min read',
    keywords: ['app conversion rate', 'mobile app onboarding', 'user activation', 'conversion optimization', 'onboarding flow'],
    content: (
      <>
        <p style={articleStyles.paragraph}>
          You spent months building your app. You finally shipped it. Users are downloading it. And then... most of them leave before they ever see the thing that makes your app great.
        </p>
        <p style={articleStyles.paragraph}>
          This is not a marketing problem. It is not an acquisition problem. It is a conversion problem, and it is one of the most common and most fixable issues in mobile apps today.
        </p>
        <p style={articleStyles.paragraph}>
          The average mobile app loses somewhere between 70% and 80% of its users within the first three days. That is not a typo. For every 100 people who download your app, you are lucky if 25 of them are still around by day three. And most of that drop off happens in the first session.
        </p>

        <h2 style={articleStyles.h2}>The real problem is not your product</h2>
        <p style={articleStyles.paragraph}>
          When conversion is low, the instinct is to go back and tweak the product. Add a feature. Fix a bug. Redesign the dashboard. But the truth is, most users never get far enough to judge your product on its merits. They bounce during onboarding.
        </p>
        <p style={articleStyles.paragraph}>
          Think about what happens when someone opens your app for the first time. They see a welcome screen. Maybe a few slides explaining what the app does. Maybe a sign up form. Maybe a permissions prompt. And somewhere in that sequence, a huge chunk of them just... close the app and never come back.
        </p>
        <p style={articleStyles.paragraph}>
          The onboarding flow is the single highest leverage point in your entire user journey. It is the first thing every user sees, and it determines whether they stick around long enough to discover any value at all.
        </p>

        <h2 style={articleStyles.h2}>What actually moves conversion</h2>
        <p style={articleStyles.paragraph}>
          After working with dozens of mobile apps across different categories, the patterns are clear. The apps that convert well do three things differently in their onboarding:
        </p>
        <p style={articleStyles.paragraph}>
          <span style={articleStyles.bold}>They get to value fast.</span> Every screen in your onboarding that does not directly help the user understand why they should care is a screen where you lose people. If your app is a habit tracker, let them create their first habit in the onboarding. If your app is a photo editor, let them edit a photo. Do not make them sit through five slides of marketing copy before they can do anything.
        </p>
        <p style={articleStyles.paragraph}>
          <span style={articleStyles.bold}>They personalize early.</span> When you ask users a couple of questions at the start ("What is your goal?" or "How experienced are you?"), two things happen. First, the user feels like the app is being tailored to them, which builds investment. Second, you now have data you can use to customize their experience going forward. Both of these increase the odds they stick around.
        </p>
        <p style={articleStyles.paragraph}>
          <span style={articleStyles.bold}>They do not ask for too much too soon.</span> Requesting notification permissions on the very first screen is a conversion killer. So is forcing sign up before the user has seen any value. Every ask you make is a moment where the user has to decide if this app is worth the effort. Stack too many of those moments at the beginning and they will choose "no."
        </p>

        <h2 style={articleStyles.h2}>The problem with guessing</h2>
        <p style={articleStyles.paragraph}>
          Here is the thing that makes onboarding optimization so frustrating: you do not know which of these changes will actually work for your specific app and your specific users until you test them.
        </p>
        <p style={articleStyles.paragraph}>
          Maybe your users actually prefer a longer onboarding that feels thorough. Maybe asking for sign up early works fine because your brand already has trust. Maybe your notification permission request converts great because you wrote excellent copy for it.
        </p>
        <p style={articleStyles.paragraph}>
          You will not know until you test. And that means you need the ability to change your onboarding flow quickly, measure the results, and iterate. If every change requires a new app build, a review process, and a week of waiting, you will run maybe four experiments a year. That is not enough.
        </p>

        <h2 style={articleStyles.h2}>Speed of iteration is the real advantage</h2>
        <p style={articleStyles.paragraph}>
          The apps with the best conversion rates are not the ones that guessed right on day one. They are the ones that iterated fastest. They tested different screen orders, different copy, different flows for different user segments. They did this weekly, not quarterly.
        </p>
        <p style={articleStyles.paragraph}>
          This is why tools like <a href="/" style={{ color: '#f26522', textDecoration: 'none', fontWeight: 500 }}>Noboarding</a> exist. When you can change your onboarding flow from a dashboard, push updates over the air, and A/B test different variants without touching your codebase or waiting for app store review, the speed at which you can optimize goes up dramatically.
        </p>
        <p style={articleStyles.paragraph}>
          Instead of running four experiments a year, you can run four a month. And each experiment teaches you something about your users that makes the next one better.
        </p>

        <h2 style={articleStyles.h2}>Start with what you can measure</h2>
        <p style={articleStyles.paragraph}>
          If you are not already tracking screen by screen completion rates in your onboarding, start there. You need to know exactly where users drop off. Is it the sign up screen? The permissions request? The third explainer slide? Once you know where the bleeding is, you can start running experiments to fix it.
        </p>
        <p style={articleStyles.paragraph}>
          Your conversion rate is not a fixed number. It is a function of how well your onboarding communicates value, and how quickly you can iterate on that communication. Get those two things right and everything downstream improves: retention, revenue, lifetime value. All of it starts with that first session.
        </p>
      </>
    ),
  },

  {
    slug: 'value-of-optimizing-onboarding',
    title: 'The Value of Optimizing Your Onboarding Flow',
    description: 'Your onboarding flow is the front door to your product. A small improvement there compounds across every user who ever downloads your app.',
    date: '2025-02-15',
    readingTime: '5 min read',
    keywords: ['onboarding optimization', 'user onboarding', 'mobile onboarding flow', 'onboarding best practices', 'user retention'],
    content: (
      <>
        <p style={articleStyles.paragraph}>
          If someone told you there was one part of your app that every single user interacts with, and that most of your user churn happens there, you would probably want to spend a lot of time getting it right.
        </p>
        <p style={articleStyles.paragraph}>
          That part of your app is the onboarding flow. And yet, in most mobile apps, onboarding gets designed once, shipped, and never touched again. The team moves on to building new features, improving performance, adding integrations. Meanwhile, the front door to the entire product sits there unchanged, quietly losing users every single day.
        </p>

        <h2 style={articleStyles.h2}>Onboarding is a multiplier, not a feature</h2>
        <p style={articleStyles.paragraph}>
          This is the mental shift that changes everything. Onboarding is not just another feature on your roadmap. It is a multiplier that sits on top of everything else you build.
        </p>
        <p style={articleStyles.paragraph}>
          Think about it this way. If your onboarding converts 30% of new users into active users, and you improve that to 40%, you have not just gained 10 percentage points. You have increased the number of people who will ever see, use, and pay for every feature you build by a third. Every improvement you make to the product after that point benefits more people.
        </p>
        <p style={articleStyles.paragraph}>
          A new feature that would have been used by 3,000 users is now used by 4,000 users. A pricing page that would have been seen by 1,500 people is now seen by 2,000. A referral prompt that would have reached 500 active users now reaches 670. The compounding effect is enormous.
        </p>

        <h2 style={articleStyles.h2}>Why most teams underinvest in onboarding</h2>
        <p style={articleStyles.paragraph}>
          There are a few reasons onboarding gets neglected, and they are all understandable but wrong.
        </p>
        <p style={articleStyles.paragraph}>
          The first is that onboarding feels "done." You built it, it works, users can get through it. Moving on to the next thing feels productive. But "works" and "works well" are very different things. A 30% completion rate technically works. It is also leaving 70% of your potential users on the table.
        </p>
        <p style={articleStyles.paragraph}>
          The second reason is that changing onboarding is expensive in a traditional setup. It is native code. You need a new build, a new review, a new release. If something goes wrong you cannot easily roll it back. This makes teams conservative. They do not experiment because the cost of experimentation is too high.
        </p>
        <p style={articleStyles.paragraph}>
          The third reason is that the impact is invisible unless you are tracking it. If you do not have screen by screen analytics on your onboarding, you literally cannot see where users are dropping off. It is much easier to focus on problems you can see, like a crashing feature or a missing capability.
        </p>

        <h2 style={articleStyles.h2}>Small changes, big results</h2>
        <p style={articleStyles.paragraph}>
          The good news is that onboarding improvements do not have to be dramatic to be meaningful. Some of the most impactful changes are surprisingly small:
        </p>
        <p style={articleStyles.paragraph}>
          Reordering screens so the most engaging one comes first instead of third. Changing a "Sign Up" button to "Continue" on a screen where sign up is not actually required yet. Adding one line of copy that explains why you are asking for notification permissions. Removing a screen entirely because it was not adding enough value to justify the friction.
        </p>
        <p style={articleStyles.paragraph}>
          Each of these changes can move your completion rate by a few percentage points. Stack a few of them together and you can see a 20% to 50% improvement in users making it through onboarding. Applied across thousands of users per month, those numbers translate directly into revenue.
        </p>

        <h2 style={articleStyles.h2}>The right way to optimize</h2>
        <p style={articleStyles.paragraph}>
          Optimization without measurement is just guessing. You need three things to do onboarding optimization properly:
        </p>
        <p style={articleStyles.paragraph}>
          First, you need screen level analytics. Not just "how many users completed onboarding" but "how many users made it from screen 2 to screen 3." The drop off is never uniform. There is always one or two screens that are doing most of the damage, and you need to find them.
        </p>
        <p style={articleStyles.paragraph}>
          Second, you need the ability to make changes quickly. If it takes a full release cycle to test a new screen order, you will never iterate fast enough to find what works. Over the air updates or server driven approaches let you change your onboarding without shipping a new binary.
        </p>
        <p style={articleStyles.paragraph}>
          Third, you need A/B testing. Changing everything at once tells you nothing. You need to isolate variables, run controlled experiments, and let the data tell you what actually worked. This is the difference between optimizing and just changing things and hoping.
        </p>

        <h2 style={articleStyles.h2}>The cost of doing nothing</h2>
        <p style={articleStyles.paragraph}>
          Every day your onboarding is not optimized, you are losing users who would have converted if the experience was just a little better. Those users are not coming back. They will not reinstall your app in three months to see if the onboarding improved. That opportunity is gone.
        </p>
        <p style={articleStyles.paragraph}>
          The tools to fix this exist now. Platforms like <a href="/" style={{ color: '#f26522', textDecoration: 'none', fontWeight: 500 }}>Noboarding</a> let you build, test, and update your onboarding flow from a dashboard, with real analytics and A/B testing built in. The question is not whether your onboarding could be better. It absolutely could. The question is how long you are willing to leave that value on the table.
        </p>
      </>
    ),
  },

  {
    slug: 'why-ab-testing-matters',
    title: 'Why A/B Testing Matters So Much',
    description: 'You can debate what users want forever. Or you can test it and know for sure. Here is why A/B testing is the most underused superpower in mobile development.',
    date: '2025-02-10',
    readingTime: '6 min read',
    keywords: ['A/B testing mobile apps', 'A/B testing onboarding', 'mobile experimentation', 'conversion optimization', 'split testing'],
    content: (
      <>
        <p style={articleStyles.paragraph}>
          Everyone in product development has opinions. Your designer thinks the onboarding should be shorter. Your PM thinks it needs more explanation. Your CEO saw a competitor's app and wants to copy their flow. Your lead engineer thinks the whole thing should be rebuilt from scratch.
        </p>
        <p style={articleStyles.paragraph}>
          Opinions are cheap. Data is expensive. And A/B testing is how you turn opinions into data.
        </p>

        <h2 style={articleStyles.h2}>The confidence problem</h2>
        <p style={articleStyles.paragraph}>
          Most product decisions are made with frighteningly little evidence. Someone has an idea, the team discusses it, and if it sounds reasonable enough, it gets built. Sometimes this works great. But a lot of the time, it does not. And the worst part is, without testing, you often cannot tell the difference.
        </p>
        <p style={articleStyles.paragraph}>
          Say you redesign your onboarding flow. Sign ups go up by 5% the following week. Was that because of the redesign? Or was it because you also ran a promotion that week? Or because it was the start of the school year and more students were downloading apps? Without a controlled test where some users saw the old flow and some saw the new one, you genuinely do not know.
        </p>
        <p style={articleStyles.paragraph}>
          A/B testing removes that uncertainty. You split your traffic. Group A gets the current experience. Group B gets the new one. Everything else stays the same. After enough users have gone through both, you can say with statistical confidence whether the change helped, hurt, or did nothing.
        </p>

        <h2 style={articleStyles.h2}>Why intuition fails</h2>
        <p style={articleStyles.paragraph}>
          One of the humbling things about A/B testing is how often your intuition is wrong. Teams that start testing frequently are shocked by the results.
        </p>
        <p style={articleStyles.paragraph}>
          The beautiful new screen that the design team spent two weeks on? It converts worse than the plain one. The clever copy that everyone in the office loved? Users do not read it. The feature that three enterprise customers requested? It confuses new users and drops completion rates.
        </p>
        <p style={articleStyles.paragraph}>
          This is not because product teams are bad at their jobs. It is because predicting human behavior is genuinely hard. You are not your users. Your team is not your users. The only reliable way to know what your users will do is to put something in front of them and watch what happens.
        </p>

        <h2 style={articleStyles.h2}>The compounding value of testing</h2>
        <p style={articleStyles.paragraph}>
          A/B testing is not just about individual experiments. It is about building a culture of evidence. Every test you run teaches you something about your users, even the ones that fail. Especially the ones that fail.
        </p>
        <p style={articleStyles.paragraph}>
          Over time, you build an increasingly accurate model of what your users respond to. You start making better first guesses. Your hit rate on changes that actually move metrics goes up. And because you are testing everything, you catch bad changes before they ship to everyone.
        </p>
        <p style={articleStyles.paragraph}>
          Think about it as compound interest for product quality. Each experiment makes you a little smarter. Over six months of weekly testing, you are making decisions with a fundamentally different level of understanding than a team that ships changes and hopes for the best.
        </p>

        <h2 style={articleStyles.h2}>Where to start testing</h2>
        <p style={articleStyles.paragraph}>
          If you are new to A/B testing, the best place to start is wherever you have the most users and the most drop off. For most apps, that is the onboarding flow. It is the highest traffic part of your product (every new user goes through it) and it is usually where the biggest losses happen.
        </p>
        <p style={articleStyles.paragraph}>
          Start simple. Test the order of your onboarding screens. Test whether adding or removing a screen helps. Test different copy on your sign up screen. These are not sexy experiments, but they move real numbers.
        </p>
        <p style={articleStyles.paragraph}>
          You do not need a massive analytics infrastructure to get started. You need a way to show different experiences to different users and a way to measure which one performed better. Tools like <a href="/" style={{ color: '#f26522', textDecoration: 'none', fontWeight: 500 }}>Noboarding</a> come with A/B testing built in specifically for onboarding flows, so you can set up an experiment in a few clicks and start getting data the same day.
        </p>

        <h2 style={articleStyles.h2}>The cost of not testing</h2>
        <p style={articleStyles.paragraph}>
          Every change you ship without testing is a gamble. Sometimes you win. Sometimes you lose. And when you lose, you often do not even realize it because you have no baseline to compare against.
        </p>
        <p style={articleStyles.paragraph}>
          The teams that test consistently outperform the teams that do not. Not because they are smarter or more creative, but because they learn faster. They ship with evidence instead of assumptions. And over time, that advantage compounds until the gap is enormous.
        </p>
        <p style={articleStyles.paragraph}>
          You can keep debating what your users want. Or you can test it and know. The choice is yours, but the math is pretty clear.
        </p>
      </>
    ),
  },

  {
    slug: 'ab-test-onboarding-not-just-paywall',
    title: 'If You Already A/B Test Your Paywall, Why Not A/B Test Your Onboarding?',
    description: 'Most teams obsess over paywall optimization but ignore the flow that determines whether users ever reach the paywall in the first place.',
    date: '2025-02-05',
    readingTime: '5 min read',
    keywords: ['paywall A/B testing', 'onboarding A/B testing', 'RevenueCat', 'mobile monetization', 'paywall optimization', 'onboarding conversion'],
    content: (
      <>
        <p style={articleStyles.paragraph}>
          If you are running a subscription app, there is a good chance you are already A/B testing your paywall. You have tested different price points, different layouts, different copy, maybe even different trial lengths. And you should be. The paywall is where money changes hands, so it makes sense to optimize it.
        </p>
        <p style={articleStyles.paragraph}>
          But here is the question nobody seems to ask: how many users actually see your paywall?
        </p>

        <h2 style={articleStyles.h2}>The funnel above the paywall</h2>
        <p style={articleStyles.paragraph}>
          Your paywall does not exist in isolation. Users have to go through your entire onboarding flow before they get there. And if your onboarding is losing 60% of users along the way, you are optimizing a paywall that only 40% of your users will ever see.
        </p>
        <p style={articleStyles.paragraph}>
          Let me put some numbers on this. Say you get 10,000 new users a month. Your onboarding completion rate is 35%. Your paywall conversion rate is 8%. That gives you 280 paying users per month.
        </p>
        <p style={articleStyles.paragraph}>
          Now say you run a bunch of paywall experiments and get that 8% up to 10%. Great work. You are now at 350 paying users. A 25% improvement.
        </p>
        <p style={articleStyles.paragraph}>
          But what if, instead, you spent that same effort optimizing your onboarding and got the completion rate from 35% to 50%? At the original 8% paywall rate, you are now at 400 paying users. A 43% improvement. And you have not touched the paywall at all.
        </p>
        <p style={articleStyles.paragraph}>
          Now do both, and you are at 500 paying users. Nearly double where you started.
        </p>

        <h2 style={articleStyles.h2}>Why teams optimize the paywall first</h2>
        <p style={articleStyles.paragraph}>
          There is a practical reason for this. Paywall testing tools are mature and widely available. RevenueCat, Adapty, Superwall, and others make it easy to create paywall variants, split traffic, and measure conversions. The tooling is great, so teams use it.
        </p>
        <p style={articleStyles.paragraph}>
          Onboarding testing has historically been harder. Your onboarding flow is usually hardcoded in your app. Changing it means changing native code, submitting a new build, and waiting for review. Running a proper A/B test means building the infrastructure to show different flows to different users, track which variant each user saw, and measure outcomes. Most teams look at that and decide it is not worth the engineering investment.
        </p>
        <p style={articleStyles.paragraph}>
          So they optimize what is easy to optimize (the paywall) and leave the rest alone. It is rational behavior given the constraints. But it leads to a lopsided funnel where the bottom is polished and the top is leaking everywhere.
        </p>

        <h2 style={articleStyles.h2}>What happens when you test both</h2>
        <p style={articleStyles.paragraph}>
          The most successful subscription apps we see are the ones that treat the entire user journey as a connected funnel and optimize every stage of it. They do not just test whether a $9.99 or $12.99 price point converts better. They test whether showing a personalization screen before the paywall increases the perceived value. They test whether moving the sign up wall from screen 2 to screen 5 changes how many people make it to the paywall at all.
        </p>
        <p style={articleStyles.paragraph}>
          These are not hypothetical experiments. Reordering onboarding screens is one of the highest impact, lowest effort changes you can test, and it routinely moves completion rates by 10 to 20 percentage points.
        </p>
        <p style={articleStyles.paragraph}>
          Think about what your onboarding is actually doing. It is building context. It is building trust. It is helping the user understand what your app does and why it matters to them. By the time they reach the paywall, their willingness to pay is largely determined by how well that onboarding went. A great onboarding does not just get more users to the paywall. It gets more <em>convinced</em> users to the paywall.
        </p>

        <h2 style={articleStyles.h2}>Making onboarding testing as easy as paywall testing</h2>
        <p style={articleStyles.paragraph}>
          The reason paywall testing took off is that tools made it easy. The same thing needs to happen for onboarding. You should be able to create a variant flow, split traffic, and see the results in a dashboard, without writing code or waiting for app review.
        </p>
        <p style={articleStyles.paragraph}>
          That is exactly what <a href="/" style={{ color: '#f26522', textDecoration: 'none', fontWeight: 500 }}>Noboarding</a> does. It is a server driven onboarding platform that lets you design flows in a visual editor, push changes over the air, and A/B test variants with built in analytics. It even integrates with RevenueCat, so you can track the impact of onboarding changes all the way through to revenue.
        </p>
        <p style={articleStyles.paragraph}>
          You would not launch a paywall without testing it. Why would you treat your onboarding any differently? The math says onboarding optimization has an equal or greater impact on revenue. The only reason it gets less attention is that it used to be harder to test. That is no longer the case.
        </p>
      </>
    ),
  },

  {
    slug: 'experimentation-source-of-truth',
    title: 'Experimentation: The Source of Truth',
    description: 'Guessing what works is a losing strategy. Testing and getting real data is the only way to know. Here is why experimentation should drive every product decision you make.',
    date: '2025-01-30',
    readingTime: '7 min read',
    keywords: ['product experimentation', 'data driven decisions', 'mobile app testing', 'growth experimentation', 'product led growth'],
    content: (
      <>
        <p style={articleStyles.paragraph}>
          There is a question that comes up in every product meeting, and it usually sounds something like this: "Do we think users want X or Y?"
        </p>
        <p style={articleStyles.paragraph}>
          Everyone around the table has an answer. The designer has a strong opinion based on user research from six months ago. The PM has a take based on competitor analysis. The CEO has a gut feeling from talking to two customers at a conference. And the engineer just wants to know which one to build so they can get started.
        </p>
        <p style={articleStyles.paragraph}>
          The right answer to "Do users want X or Y?" is almost always "Let's test it." But that is rarely what happens.
        </p>

        <h2 style={articleStyles.h2}>The problem with opinions</h2>
        <p style={articleStyles.paragraph}>
          Opinions are not useless. Good product intuition, informed by experience and user empathy, is genuinely valuable. The problem is that even the best intuition is wrong a shocking amount of the time.
        </p>
        <p style={articleStyles.paragraph}>
          Google famously tested 41 shades of blue for their link color. Not because their designers could not pick a good blue, but because the difference between the "right" blue and the "close enough" blue was worth $200 million in annual revenue. Their designers' instincts would have picked a perfectly good blue. Testing found the one that made them $200 million more.
        </p>
        <p style={articleStyles.paragraph}>
          You are not Google. The stakes on any individual decision are probably lower. But the principle is the same: the gap between what you think will work and what actually works is often bigger than you expect, and the only way to close that gap is to test.
        </p>

        <h2 style={articleStyles.h2}>Why guessing is a losing strategy</h2>
        <p style={articleStyles.paragraph}>
          When you make product decisions without testing, you are essentially making bets. Sometimes you win, sometimes you lose. And the problem is not that you lose sometimes. The problem is that when you lose, you usually do not know it.
        </p>
        <p style={articleStyles.paragraph}>
          You ship a change. Metrics move. But metrics move for a hundred reasons. Seasonality, marketing campaigns, competitor launches, app store featuring, even the day of the week. Without a controlled experiment, you cannot isolate the impact of your change from all the noise.
        </p>
        <p style={articleStyles.paragraph}>
          So you end up in a situation where you have shipped dozens of changes, your metrics have gone up and down, and you genuinely do not know which changes helped and which ones hurt. You are flying blind and calling it product development.
        </p>

        <h2 style={articleStyles.h2}>Experimentation as a system</h2>
        <p style={articleStyles.paragraph}>
          The most effective product teams do not treat testing as a nice to have. They treat it as a system. Every significant change gets tested. Results are documented and shared. Learnings inform future hypotheses.
        </p>
        <p style={articleStyles.paragraph}>
          This sounds heavy and bureaucratic, but it does not have to be. A simple experiment can be as lightweight as: "We think moving the notification permission request from screen 2 to screen 4 will reduce drop off. Let's split traffic 50/50 for two weeks and see."
        </p>
        <p style={articleStyles.paragraph}>
          That is it. One hypothesis, one change, one measurement period. It does not require a data science team or a massive analytics platform. It requires the ability to show different experiences to different users and track the outcomes.
        </p>

        <h2 style={articleStyles.h2}>What experimentation reveals</h2>
        <p style={articleStyles.paragraph}>
          Running experiments consistently does something beyond just improving individual metrics. It teaches you about your users in a way that no amount of survey data or user interviews can match.
        </p>
        <p style={articleStyles.paragraph}>
          Surveys tell you what users say they want. Experiments tell you what users actually do. And there is often a significant gap between those two things. Users will tell you they love a feature and then never use it. They will say they do not care about a certain screen and then bounce when you remove it.
        </p>
        <p style={articleStyles.paragraph}>
          Over time, this behavioral data builds into something incredibly valuable: a real, evidence based understanding of your user base. Not assumptions. Not personas. Not guesses. Actual observed behavior in controlled conditions.
        </p>

        <h2 style={articleStyles.h2}>Where most teams go wrong</h2>
        <p style={articleStyles.paragraph}>
          The biggest mistake teams make with experimentation is not doing it at all. The second biggest mistake is testing the wrong things.
        </p>
        <p style={articleStyles.paragraph}>
          Changing a button color from blue to green is not going to meaningfully move your metrics. Testing a completely different flow, a different screen sequence, a different value proposition, or a different ask (permissions, sign up, purchase) at a different point in the journey? Those are the experiments that move the needle.
        </p>
        <p style={articleStyles.paragraph}>
          Start with your onboarding flow. It is the highest leverage part of your app because every single user goes through it. Test the number of screens. Test the order. Test whether asking for sign up before or after showing value changes your conversion. Test whether a personalization step at the beginning increases completion rates.
        </p>

        <h2 style={articleStyles.h2}>Making experimentation easy</h2>
        <p style={articleStyles.paragraph}>
          The reason more teams do not experiment is not that they do not believe in it. It is that the infrastructure required has traditionally been expensive and complex to build. You need a way to split traffic, serve different experiences, track events, and analyze results. Building this in house is a real engineering investment.
        </p>
        <p style={articleStyles.paragraph}>
          But the landscape has changed. For paywalls, tools like RevenueCat and Superwall handle the experimentation layer. For onboarding, platforms like <a href="/" style={{ color: '#f26522', textDecoration: 'none', fontWeight: 500 }}>Noboarding</a> let you build flow variants in a visual editor, split traffic, and see results in a built in analytics dashboard. You can set up and run an onboarding experiment in minutes, not weeks.
        </p>
        <p style={articleStyles.paragraph}>
          The tools are there. The math is clear. The question is not whether experimentation works. It has been proven over and over again, by companies of every size, in every industry. The question is whether you are going to adopt it as your source of truth, or keep guessing and hoping for the best.
        </p>
        <p style={articleStyles.paragraph}>
          Your users will tell you what they want. Not in emails or surveys, but in their behavior. All you have to do is run the experiment and listen.
        </p>
      </>
    ),
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getAllSlugs(): string[] {
  return blogPosts.map((post) => post.slug)
}
