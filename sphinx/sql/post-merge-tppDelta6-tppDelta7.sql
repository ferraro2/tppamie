SET @ts:=(\
SELECT tstamp FROM sphinx_meta \
WHERE tablename='delta7_maxts');
UPDATE sphinx_meta \
SET tstamp = @ts \
WHERE tablename = 'delta6_maxts';