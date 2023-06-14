SET @ts:=(\
SELECT tstamp FROM sphinx_meta \
WHERE tablename='delta10_maxts');
UPDATE sphinx_meta \
SET tstamp = @ts \
WHERE tablename = 'delta9_maxts';