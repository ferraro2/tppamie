SET @ts:=(\
SELECT tstamp FROM sphinx_meta \
WHERE tablename='delta9_maxts');
UPDATE sphinx_meta \
SET tstamp = @ts \
WHERE tablename = 'delta8_maxts';