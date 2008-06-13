
LibX Standard Cues.

Note: the cue functions (dfu actions) execute in a try/catch clause.
An error, if any, is output to the log if libx.doforurl.debug is true.

Let's adopt an optimistic, linear style for these cues.
Don't do any checking for whether the page being cued hasn't changed.
This will
a) keep the code shorter
b) will make it easier for us to keep cues updated, because we'll often see
   what broke simply by turning debugging on and reading the error message. 

