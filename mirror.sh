#!/bin/bash
#
# I mirror blackmilkclothing.com

COOKIES=./cookies.txt
LOG=./log/mirror.`date "+%F_%T"`.log
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36"

# --user-agent="$USER_AGENT" \

cd `dirname $0`

# record the script that was used to trigger
cat $0 > $LOG

# make one request to ensure it's the right theme
wget \
	--load-cookies $COOKIES \
	--save-cookies $COOKIES \
	"http://blackmilkclothing.com/collections?theme=main"

rm collections # this was just fetched, but we don't care

# start it (in the background)
wget \
	--append-output=$LOG \
	--background \
	--load-cookies $COOKIES \
	--mirror \
	--exclude-domains=blog.blackmilkclothing.com \
	--wait=1s \
	--random-wait \
	--reject .js,.css \
	"http://blackmilkclothing.com/collections" \
	"http://blackmilkclothing.com/collections/all"

# show the log as it's going
tail -f $LOG

echo
echo "'wget' hasn't been stopped, you've just stopped watching its log:"
echo
ps auwx | grep wget | grep mirror
echo
