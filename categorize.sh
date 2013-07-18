#!/bin/bash
#
# I categorize products based on the collections it is listed within

cd `dirname $0`

for p in `ls blackmilkclothing.com/products/*.oembed | cut -d / -f 3 | cut -d . -f 1`; do
    for c in `find blackmilkclothing.com/collections -name $p | cut -d / -f 3`; do
        echo "$p:$c"
    done
done > categories.txt
