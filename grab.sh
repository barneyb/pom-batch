#!/bin/bash
#
# I pulled down the mirrored directory from AWS

cd `dirname $0`

rsync -a --progress --verbose --stats --delete-after barneyb@barneyb.com:~/blackmilkclothing.com/blackmilkclothing.com/ ./blackmilkclothing.com/
