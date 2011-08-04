To configure TokLive application, do the following:

1. Change database configuration settings in app/config/data.php (see lines 44-47)
2. Change base URL in scripts/toklive_config.js (see line 22)
3. Apply Twitter API key in index.html (see line 7, replace key within id parameter of URL)
4. Change OpenTok key and secret in php/GetSession.php (see lines 6 and 7)
5. Configure twitter stream search term or hashtag in scripts/toklive_config.js (see line 23).
6. Configure stream provider in scripts/toklive_config.js (see line 24).  Supported values include "justin.tv", "livestream" and "ustream".
7. Configure stream id in scripts/toklive_config.js (see line 25).  Stream ID is dependent on stream provider.  See scripts/toklive_config.js for details.