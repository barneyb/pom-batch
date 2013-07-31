#!/bin/bash
#
# I mirror blackmilkclothing.com

LOG=./log/mirror.`date "+%F_%T"`.log
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36"

# --user-agent="$USER_AGENT" \

cd `dirname $0`

# record the script that was used to trigger
cat $0 > $LOG

# start it (in the background)
wget \
	--append-output=$LOG \
	--background \
	--no-cookies \
	--header "Cookie: theme=main" \
	--mirror \
	--exclude-domains=blog.blackmilkclothing.com \
	--wait=1s \
	--random-wait \
	--reject ".js,.css,\?theme=mobile" \
	"http://blackmilkclothing.com/collections" \
	"http://blackmilkclothing.com/collections/all"

# show the log as it's going
tail -f $LOG

echo
echo "'wget' hasn't been stopped, you've just stopped watching its log:"
echo
ps auwx | grep wget | grep mirror
echo
