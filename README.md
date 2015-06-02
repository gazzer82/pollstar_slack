# pollstar_slack

A Node.js bot that fetches live dates from Pollstar

Little bot i put togther to save me a trip to Safarai from Slack.

It will accept an icoming post via a slash command on slack, the post must contain a text variable containing a band name.

It will then look that artist up via the Pollstar api, search for all future dates, and return them via an incoming webhook directy to the user as a DM (appears to come from Slackbot).

For this to work you will need a Pollstar API Key http://www.pollstar.com/etc/api/api.htm and the Token from the slack slash command.

These then need setting as ENV Variables POLLSTAR_KEY and SLACK_KEY on whatever server you are deploying to, this is currently setup to deploy to a Dokku droplet via shippable, but it should happily deploy to anything that will run Node.

I think that's it, get in touch with any questions!

Gareth

