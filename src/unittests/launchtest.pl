#!/usr/bin/perl -w

my $resultsdir;			# directory where results/diffs are stored
my $suitedir;			# directory where test and ref files are stored
my %refdir = ();		# stores testsuite(index) and directory(value)
my $args_topass = "";	# space delimited string of args to pass
my $out_file = "none";	# saves the file to which we will write output
my @buffer;				# temporary buffer for the output of a test
my %failures = ();		# errors from diffs against reference files
my $timestamp = time();	# so we can create multiple, unique reports
my %valid_args;			# hash of properties for each argument
my $recording = 0;		# boolean, true if recording, false if not

&define_valid_args (\%valid_args);	# define valid arguments that we can expect

# read, interpret, and handle arguments
foreach (@ARGV) {
	if (!exists ($valid_args{$_})) {
		$args_topass .= $_.' ';	
	}
	else {
		my $callback = $valid_args{$_}{fn};
		&$callback(\%valid_args);	
	}
}
if ($valid_args{'--all'}{value} != 1) {
	$args_topass =~ s/\s+$//;	# strip trailing whitespace
}
open (TESTOUTPUT, "jrunscript -cp . rununittests.js $args_topass |");
while (<TESTOUTPUT>) {
	if (/^##\s/) {
		# we will prefix ## to lines that we intend for the launcher; additional
		# directives can be supported if desired
		if (/^## TestLauncher: (\w+) --> (.+)/) {
			$refdir{$1} = $2;
		}
		elsif (/^## RecordOutput_(Begin|End): (.+)\.(.+)/) {
			#					  $1		   $2    $3
			if ($1 eq 'Begin') {
				$out_file = $refdir{$2}."/".$3;
				$recording = 1;
				print "Running Test: $2.$3\n";
			}
			elsif ($1 eq 'End') {
				$recording = 0;
				if ($valid_args{"--ref"}{value} == 1) {
					print ">> Is this test output correct? (y/n): ";
					chomp ($accept = <STDIN>);
					if ($accept eq 'y') {
						&writeBufferToFile ($suitedir."$out_file.ref", @buffer);
					}
				}
				else {
					&writeTestOutput($resultsdir.$out_file, @buffer);
					&performDiff($out_file);
				}
				undef @buffer;
			}
		}
		elsif (/^## SUITEDIR: (\w+\/)/) {
			$suitedir = $1;

			# do the unit test runner a huge favor by indexing the dir tree
			# under $suitedir, so we don't have to write some ridiculous
			# javascript to do this for us
			open (LISTING, "ls -1RI 'CVS' $suitedir |");
			@dirlist = <LISTING>;
			close (LISTING);
			&writeBufferToFile ($suitedir."index", @dirlist);
		}
		elsif (/^## RESULTSDIR: (\w+\/)/) {
			$resultsdir = $1;
		}
		elsif (/^## RecordOutput_End: Suite .AllTests.$/) {
			$valid_args{"-v"}{value} = 1;
		}
	}
	else {
		print $_ 			if ($valid_args{"-v"}{value} == 1);
		push(@buffer, $_) 	if ($recording == 1)
	}
}
close (TESTOUTPUT);
# if there are no errors, then no results file will be created; the success
# message displayed with the test output is all we get
if (keys(%failures) > 0) {
	print "Some test outputs did not match their reference files\n";
	print "Please see $resultsdir"."all/results_$timestamp.txt \n\n";
	&writeResults($timestamp, \%failures);
}

# write any failures to a results file
sub writeResults
{
	my $timestamp	 	= shift;
	my $hash_buffer		= shift;
	my @buffer;
	while (my ($key, $value) = each %$hash_buffer ) {
		push (@buffer, "$key\n$value\n\n");
	}
	&writeBufferToFile ($resultsdir."all/results_$timestamp.txt", 
		@buffer);
}

# write output to be compared against the corresponding reference file
sub writeTestOutput
{
	my $file = shift;
	my @outbuffer = @_;

	&writeBufferToFile ("$file.txt", @outbuffer);
}

# generic function to write an array of 'lines' to a file
sub writeBufferToFile	# {{{
{
	my $file 	= shift;
	my @buffer 	= @_;

	# this call could occur on a new testoutput creation, or a new ref
	# file, so we need to make sure the directories 
	$_ = $file;
	/^((\w+\/)+)/;
	system("mkdir -p $1");

	open (TOFILE, ">", "$file")
		or die ("Could not open file $file for writing\n");
	foreach (@buffer) {
		print TOFILE $_;
	}
	close (TOFILE);
}	# }}}

# perform a diff on test output against a reference file
sub performDiff
{
	my $file = shift;
	$result = `diff -uB $resultsdir$file.'txt' $suitedir$file.'ref'`;

	if ($?) {
		print "Ignoring reference file check for this test\n";
	}
	elsif ($result ne '') {
		print "Test output != Ref file. See $resultsdir$file.diff\n";
		&writeBufferToFile ("$resultsdir$file.diff", $result);
		$failures{"$resultsdir$file: Output did not match ref file"} = $result;
	}
	else {
		print "Reference file matched test file!\n";
	}
}
# --all callback function; run all tests 
sub __cb_arg_all	# {{{
{
	my $arg_list = shift;
	$arg_list->{'--all'}{value} = 1;
}	# }}}

# --help callback function; display help output and exit
sub __cb_arg_help	# {{{
{
	my $arg_list = shift;
	format CONTENTS =
  @<<<<<<	@<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	$arg,	$desc
.
	print "Usage: ./launchtest.pl [OPTION] [TESTSUITE]\n";
	print "Examples: \n";
	print "  ./launchtest.pl testsuite1 testsuite2 testsuiteN\n";
	print "  ./launchtest.pl -v packagevisitor\n";
	print "  ./launchtest.pl --ref --all\n\n";

	$~ = CONTENTS;
	for $arg (sort keys %$arg_list) {
		$desc = $arg_list->{$arg}{desc};
		write;
	}
	print "\n";
	exit;
}	# }}}

# --ref callback function; create reference file based on test output
sub __cb_arg_ref	# {{{
{
	my $arg_list = shift;
	$arg_list->{'--ref'}{value} = 1;
	$arg_list->{'-v'}{value} 	= 1;	# turn -v on
}	# }}}

# -v callback function; switch on verbosity, i.e., display all test output
sub __cb_arg_v	# {{{
{
	my $arg_list = shift;
	$arg_list->{'-v'}{value} = 1;
}	# }}}

# define the description, callback functions, and default values for each arg
sub define_valid_args
{
	my $args = shift;
	%$args = (		# // setup args hash {{{
		'--all' 	=>	{ 	
			fn 		=> "__cb_arg_all", 
			desc 	=> "Run all tests" ,
			value	=> 0
		},
		'--help'	=>	{
			fn 		=> "__cb_arg_help", 
			desc 	=> "Display help output" ,
			value	=> 0
		},
		'--ref'		=>	{
			fn 		=> "__cb_arg_ref", 
			desc 	=> "Create reference file(s) from test output" ,
			value	=> 0
		},
		'-v'		=> {
			fn 		=> "__cb_arg_v", 
			desc 	=> "Verbose : Display all test output" ,
			value	=> 0
		}
	);
# }}}
}
