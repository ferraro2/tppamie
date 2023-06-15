<?php
echo "------------------------------------------\n";
echo "------------------------------------------\n";
echo "------ Sphinx Log Merge & ReIndexer ------\n";
echo "------------------------------------------\n";
echo "------------------------------------------\n\n";

# windows must run as administrator. not sure about linux yet
if ($argc < 4) {
    echo "Usage: $argv[0] <os> <debug print flag> <mysql pass>";
    return;
}

define("LINUX", $argv[1] == 'windows' ? 0 : 1);
define("VERBOSE", $argv[2] == '1' ? 1 : 0);
define("MYSQL_PASS", $argv[3]);

if(LINUX) {
	define("INDEXER", "indexer");
	define("DATA_PATH", "/mnt/volume_nyc1_01/sphinx/data/");
	define("MYSQL_USER", "logsbot");
	define("CONFIG", "sphinx.conf");
} else {	
	define("INDEXER", "indexer.exe");
	define("DATA_PATH", "C:\\Users\\admin\\Documents\\main\\installs\\sphinx-2.2.11-release-win64\\data\\");
	define("MYSQL_USER", "root");
	define("CONFIG", "sphinx.conf");
}

define("ERROR_LOG", "errorlog.txt");
function logError($str) {
	echo $str;
	file_put_contents(ERROR_LOG, $str, FILE_APPEND | LOCK_EX);
}

function mergeAndUpdate($base, $delta) {
	echo "Merging $delta into $base... ";
	if(LINUX) {
		$code = "sudo " . INDEXER . " -c " . CONFIG . " --rotate --merge $base $delta";
	} else {
		$code = "cmd.exe /c ". INDEXER . " -c " . CONFIG . " --rotate --merge $base $delta";
	}
	exec($code, $output, $exitCode);
	echo "done!\n";
	if(VERBOSE) {
		print_r($output);
	}
	
	if ($exitCode === 0) {
		updateMaxTs($base, $delta);
		reIndex($delta);
	} else {
		logError("Merge of $delta into $base FAILED\nOutput: $output\nExit Code: $exitCode\n\n");
	}
}

function updateMaxTs($base, $delta) {	
	echo "Updating $base maxts... ";
	if(LINUX) {
		$code = "mysql -u" . MYSQL_USER . " -p" . MYSQL_PASS. " tpp_chat < sql/post-merge-$base-$delta.sql";
	} else {
		$code = "cmd.exe /c \"mysql -u" . MYSQL_USER . " -p" . MYSQL_PASS. " tpp_chat < sql/post-merge-$base-$delta.sql\"";
	}
	exec($code, $output, $exitCode);
	echo "done!\n";
	if(VERBOSE) {
		print_r($output);
	}	
	
	if ($exitCode !== 0) {
		logError("UpdateMaxTs of $delta into $base FAILED\nOutput: $output\nExit Code: $exitCode\n\n");
	}
	
	echo "------\n";
}

function reIndex($index) {
	echo "Re-indexing $index... ";
	if(LINUX) {
		$code = INDEXER . " -c " . CONFIG . " --rotate $index";
	} else {
		$code = "cmd.exe /c ". INDEXER . " -c " . CONFIG . " --rotate $index";
	}
	exec($code, $output, $exitCode);
	echo "done!\n";
	if(VERBOSE) {
		print_r($output);
	}
	
	if ($exitCode !== 0) {
		logError("Reindex of $index FAILED\nOutput: $output\nExit Code: $exitCode\n\n");
	}
}

while (1) {
	$activity = 1;
	if (filemtime(DATA_PATH . 'tppMain.sph') < 0) {
		# INDEX FULL (we try to cap at 2 GB)
		# mergeAndUpdate("tppMain", "tppDelta1");
    } elseif (filemtime(DATA_PATH . 'tppDelta1.sph') < 0) {
		# INDEX FULL
		# mergeAndUpdate("tppDelta1", "tppDelta2");
	} elseif (filemtime(DATA_PATH . 'tppDelta2.sph') < 0) {
		# INDEX FULL
		# mergeAndUpdate("tppDelta2", "tppDelta3");
    } elseif (filemtime(DATA_PATH . 'tppDelta3.sph') < time()-(31104000 * 10)) {  # 10 years aka unused
		mergeAndUpdate("tppDelta3", "tppDelta4");
    } elseif (filemtime(DATA_PATH . 'tppDelta4.sph') < time()-(31104000)) {  # 1 year
		mergeAndUpdate("tppDelta4", "tppDelta5");
    } elseif (filemtime(DATA_PATH . 'tppDelta5.sph') < time()-(86400 * 30 * 2)) {  # 2 months
		mergeAndUpdate("tppDelta5", "tppDelta6");
    } elseif (filemtime(DATA_PATH . 'tppDelta6.sph') < time()-(86400 * 10)) {  # 10 days
		mergeAndUpdate("tppDelta6", "tppDelta7");
    } elseif (filemtime(DATA_PATH . 'tppDelta7.sph') < time()-(86400)) {  # 24 hours
		mergeAndUpdate("tppDelta7", "tppDelta8");
    } elseif (filemtime(DATA_PATH . 'tppDelta8.sph') < time()-(3600 * 5)) {  # 5 hours
		mergeAndUpdate("tppDelta8", "tppDelta9");
    } elseif (filemtime(DATA_PATH . 'tppDelta9.sph') < time()-(60 * 10)) {  # 10 min
		mergeAndUpdate("tppDelta9", "tppDelta10");
    } elseif(filemtime(DATA_PATH . 'tppDelta10.sph') <= time()-(5)) {
		reIndex("tppDelta10");
    } else {
		$activity = 0;
	}
	if ($activity) {
		echo "------------------------\n\n";
	}
    sleep(2);
    clearstatcache();
} 
?>