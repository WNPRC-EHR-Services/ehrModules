#!/usr/bin/perl

=head1 DESCRIPTION

This script is designed to run as a cron job that will permanently delete
and record in a study dataset with a QCState of 'Review Requested'.

This was created because conventional deletes were running extremely slow in the 
EHR.  This is a non-optimal mechanism that allows the user to avoid needing to
perform an actual delete.  Through the UI, they change the QCState of a record
to 'Delete Requested'.  This script periodically runs to clean out these records
in the background.


=head1 LICENSE

This package and its accompanying libraries are free software; you can
redistribute it and/or modify it under the terms of the GPL (either
version 1, or at your option, any later version) or the Artistic
License 2.0.

=head1 AUTHOR

Ben Bimber

=cut

use strict;
use Labkey::Query;
use Data::Dumper;
use Time::localtime;
#use File::Touch;

my $log_file = '/usr/local/labkey/deletes/deleteLog.txt';

my $default_container = '/WNPRC/EHR';
#my $baseUrl = 'https://xnight.primate.wisc.edu:8443/labkey/';
my $baseUrl = 'http://localhost:8080/labkey/';

# Find today's date to append to filenames
my $tm = localtime;
my $datestr=sprintf("%04d%02d%02d_%02d%02d", $tm->year+1900, ($tm->mon)+1, $tm->mday, $tm->hour, $tm->min);


open(OUTPUT,">", $log_file);

my $datasets = findDatasets();

foreach my $dataset (@$datasets){	
	my $results = Labkey::Query::selectRows(
		-baseUrl => $baseUrl,
		-containerPath => $default_container,
		-schemaName => 'study',
		-queryName => $dataset,
		-filterArray => [['QCState/Label', 'eq', 'Delete Requested']]
		#-columns => $args->{columns},			
	);	
				
	my $toDelete = [];
	if(@{$results->{rows}}){
		my @fields;
		foreach my $field (@{$results->{metaData}->{fields}}){	
			push(@fields, $field->{name});
		};
		print OUTPUT "\nSTART: $datestr, $dataset\n";
		print OUTPUT join("\t", @fields) . "\n";			
		
		foreach my $row (@{$results->{rows}}){	
			push(@$toDelete, {lsid => $$row{'lsid'}});
			
			my @line;						
			foreach (@fields){			
				if ($row->{$_}){
					push(@line, $row->{$_});
				}			
				else {
					push(@line, "");
				}		 			
			}				
			print OUTPUT join("\t", @line);
			print OUTPUT "\n";				
		}
	}
					
	if(@$toDelete){
		my $results = Labkey::Query::deleteRows(
			-baseUrl => $baseUrl,
			-containerPath => $default_container,
			-schemaName => 'study',
			-queryName => $dataset,
			-rows => $toDelete			
		);			
		
		my $tm = localtime;
		my $datestr=sprintf("%04d%02d%02d_%02d%02d", $tm->year+1900, ($tm->mon)+1, $tm->mday, $tm->hour, $tm->min);
		
		print "Done Deleting ".@$toDelete." Rows For: $dataset, $datestr";
	}			
}
 
sub findDatasets {
	my $results = Labkey::Query::selectRows(
		-baseUrl => $baseUrl,
		-containerPath => $default_container,
		-schemaName => 'study',
		-queryName => 'datasets',
	);
	
	my $datasets = [];
	
	foreach my $row (@{$results->{rows}}){	
		push(@$datasets, $$row{'Label'});
	}	
	
	return $datasets;						
}
	
#touch($log_file);	
#close OUTPUT;

