SET @ts:=(\
SELECT tstamp FROM sphinx_meta \
WHERE tablename='delta2_maxts');
UPDATE sphinx_meta \
SET tstamp = @ts \
WHERE tablename = 'delta1_maxts';