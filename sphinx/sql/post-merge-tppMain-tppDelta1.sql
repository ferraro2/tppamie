SET @ts:=(\
SELECT tstamp FROM sphinx_meta \
WHERE tablename='delta1_maxts');
UPDATE sphinx_meta \
SET tstamp = @ts \
WHERE tablename = 'main_maxts';