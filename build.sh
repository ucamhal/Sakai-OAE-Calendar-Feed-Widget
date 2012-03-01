#!/bin/bash
set -e # Exit on error

WIDGET_NAME=calendarfeed

# The root of the widget's source directory
base_dir=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)
cd $base_dir


# Pull version from VERSION file
widget_version=`head -n 1 VERSION`
zipfile_name="$WIDGET_NAME-$widget_version.zip"
temp_dir=`mktemp -d /tmp/calendarfeed.XXXXXX`
build_dir="$temp_dir/$WIDGET_NAME/"

echo "Building $WIDGET_NAME version: $widget_version"
echo
echo "Rebuilding bundles from src-bundles..."
src-bundles/build.sh

echo
echo "Building widget zip archive ($zipfile_name)..."
# Copy our resources into the build directory
mkdir $build_dir
cp -a VERSION bundles config.json images lib calendarfeed.html css \
      javascript $build_dir

# Build the zip file from the copied files
pushd $temp_dir
zip -9 -r "$base_dir/$zipfile_name" $WIDGET_NAME
popd &>/dev/null

echo
echo "Written $zipfile_name"

#clean up the temporary directory
rm -r $temp_dir
