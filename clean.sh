#!/bin/bash
set -e # Exit on error
cd `dirname "${BASH_SOURCE[0]}"`
if [ -e bundles/*.properties ] ; then rm bundles/*.properties; fi
if [ -d bundles ] ; then rmdir bundles; fi
zipfile="calendarfeed-$(head -n 1 VERSION).zip"
if [ -e $zipfile ] ; then rm $zipfile; fi
