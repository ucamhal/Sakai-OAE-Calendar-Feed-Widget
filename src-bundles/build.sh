#!/bin/bash
CLOJURE_CMD="clj"

if ! which $CLOJURE_CMD &>/dev/null ; then
    echo "Clojure executable (cmd: $CLOJURE_CMD) not found."\
         "Can't run conversion script"
    exit
fi

DIR=`dirname "${BASH_SOURCE[0]}"`
cd $DIR
mkdir -p "../bundles"

# Process each java property file in src-bundles/ writing a sakai property
# file into bundles/
for PROPFILE in `find . -name "*.properties"`; do
    NAME=`basename "$PROPFILE"`
    echo -n "Building $NAME..."
    $CLOJURE_CMD ./javaprop2sakaiprop.clj "$PROPFILE" > "../bundles/$NAME"
    echo "done"
done
