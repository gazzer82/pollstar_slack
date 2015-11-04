# pollstar_slack

A Node.js bot that fetches live dates from Pollstar

Little bot i put togther to save me a trip to Safarai from Slack.

It will accept an icoming post via a slash command on slack, the post must contain a text variable containing a band name.

It will then look that artist up via the Pollstar api, search for all future dates, and return them via an incoming webhook directy to the user as a DM (appears to come from Slackbot).

For this to work you will need a Pollstar API Key http://www.pollstar.com/etc/api/api.htm and the Token from the slack slash command.

These then need setting as ENV Variables POLLSTAR_KEY with your key for the pollstar API.

You will also need to define two slack related enviromnetal variable SLACK_KEYS and OUTGOING_URLS, these should contain comma seperated lists with no spaces of the slack key sent from the outgoing webhook, and the incoming webhook URL's respectively.

It's important that the order of the key and url's match in the two variabls as an command coming in mathing the ket at index 0 will send back to the incoming hook url at index 0 e.t.c

I think that's it, get in touch with any questions!

Gareth

