SET @ts:=(\
SELECT tstamp FROM sphinx_meta \
WHERE tablename='delta4_maxts');
UPDATE sphinx_meta \
SET tstamp = @ts \
WHERE tablename = 'delta3_maxts';