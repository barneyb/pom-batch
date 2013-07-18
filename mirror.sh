#!/bin/bash
#
# I mirror blackmilkclothing.com

COOKIES=./cookies.txt
LOG=./log/mirror.`date "+%F_%T"`.log
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36"

cd `dirname $0`

touch $LOG

wget \
	--append-output=$LOG \
	--background \
	--load-cookies $COOKIES \
	--save-cookies $COOKIES \
	--mirror \
	--exclude-domains=blog.blackmilkclothing.com \
	--wait=0.25s \
	--random-wait \
	--reject .js,.css \
	"http://blackmilkclothing.com/collections?theme=main" \
	"http://blackmilkclothing.com/collections/all"

#	--user-agent="$USER_AGENT" \

tail -f $LOG
