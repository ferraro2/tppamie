<?php
    /***********************************************************
     ***********************************************************
     *      SPHINX MATCH QUERY PREPARATION
     ***********************************************************
     ***********************************************************/

    /*
    * @param ($q)  query string
    * @param ($u)  users string
    * @return      a sphinx-readable query for the relevant query and users, entirely
    *  contained within a set of parenthesis
    */
    function createQuery($q, $u) {
        if ($q === '' && $u === '') {
            // both fields are empty
            return '';
        }

        $ret = '';
        if ($q !== '') {
            //add message query
            $ret .= "(@msg " . translate_query($q) .  " ) ";
        }

        if ($u !== '') {
            //add users query
            // only two sensical patterns:
            if (strpos($u, "!") === False) {
                // messages by user1 or user2
                $u_match = preg_replace("/[ ]/", " | ", $u);
            } else {
                // messages not by !user1
                // sphinx refuses !user1 !user2
                $u_match = $u;
            }
            $ret .= " (@username $u_match)";
        }

        if ($q !== '' && $u!= '') {
            // if both queries are present, surround them in parenthesis
            return " ( $ret ) ";
        } else {
            //otherwise, the query ok for returning
            return $ret;
        }
    }

    /*
     * Users typically want to search for:
     *  "(looking for cat) | dog | mouse"
     * would prefer to type
     *  "looking for cat or dog or mouse"
     * 
     * By default in sphinx:
     * "looking for cat | dog | mouse" means "looking for ( cat | dog | mouse )" 
     * 
     * But we'd rather it mean "(looking for cat) | dog | mouse"
     * And let users type it 
     * 
     * 
     */
    function translate_query($q) {
        // translate tppvisuals `OR` to new `or` syntax
        $q = str_replace(" OR ", " or ", $q);
    //    $q = str_replace(" or ", " | ", $q);
        return minimize_or_precedence($q);
    }


    /*
     * This turns 'or' (lowercase) into a new or operator with 
     * lower precedence than the implicit AND between words.
     */
    function minimize_or_precedence($str) {
            return minimize_or_precedence_recursive(str_split($str));
    }
    function minimize_or_precedence_recursive($chars) {
        $len = count($chars);
        $chunks = array();
        $i = 0;
        while ($i < $len) {
            $c = $chars[$i];
            if ($c !== '(') {
                array_push($chunks, $c);
                $i += 1;
            } else {
                $subgroup = array();
                $level = 1;
                $i += 1;
                while ($level > 0) {
                    $c = $chars[$i];
                    if ($c === '(') {
                            $level += 1;
                    } else if ($c === ')') {
                            $level -= 1;
                    }  
                    if ($level != 0) {
                            array_push($subgroup, $c);
                    }
                    $i += 1;
                }
                #echo var_dump($subgroup);
                array_push($chunks, '(');
                array_push($chunks, minimize_or_precedence_recursive($subgroup));
                array_push($chunks, ')');
            }

        }
        $string_all = implode("", $chunks);
        #echo $string_all . "\n";
        $nonOrParts = orSplit($string_all);
        #echo var_dump($nonOrParts);
        $result = implode(" | ", $nonOrParts);
        return $result;

    }

    function orSplit($str) {
            $nonOrParts = array();
            preg_match_all("/\W(or)\W/", $str, $orMatches, PREG_OFFSET_CAPTURE);
            $startIndexOfNextPart = 0;
            // echo var_dump($str);
            // echo var_dump($orMatches);
            if (count($orMatches[1]) === 0) {
                    array_push($nonOrParts, $str);
            } else {
                    foreach($orMatches[1] as $arr) {
                            $endIndexOfNextPart = $arr[1];
                            $substrlen = $endIndexOfNextPart - $startIndexOfNextPart;
                            array_push($nonOrParts, 
                                    "("
                                    . trim(substr($str, $startIndexOfNextPart, $substrlen))
                                    . ")");
                            $startIndexOfNextPart = $endIndexOfNextPart + 2;
                    }
                    array_push($nonOrParts, "(" . trim(substr($str, $startIndexOfNextPart)) . ")");
            }
            return $nonOrParts;
    }

    function test_minimize_or_precedence() {
        assertEq("hi", "hi");
        assertEq("a or b", "(a) | (b)");
        assertEq("a or (b or c)", "(a) | (((b) | (c)))");
        assertEq("a (b or c)", "a ((b) | (c))");
        assertEq("a or (b or (c or d))", "(a) | (((b) | (((c) | (d)))))");
        assertEq("dog the red or pot pan", "(dog the red) | (pot pan)");
        assertEq("dog OR red or pot pan", "(dog OR red) | (pot pan)");
        assertEq("dog OR red | blue or pot pan", "(dog OR red | blue) | (pot pan)");
        assertEq("dog the red or pot or coordinates", "(dog the red) | (pot) | (coordinates)");
        assertEq("ab c or de fg or x y z or pot", "(ab c) | (de fg) | (x y z) | (pot)");
        assertEq("!ab or !cd a or(lol 2 3)", "(!ab) | (!cd a) | ((lol 2 3))");
    }

    function assertEq($input, $expected) {
            $result = inc_or_precedence($input);
            if ($result !== $expected) {
                    echo "\nInvalid Assertion: Input " . $input . " yielded " . $result . ", expected " . $expected;
            }
    }

    function getMatchQuery($q1, $q2, $q3, $u1, $u2, $u3) {
    // add escaping for the '@' character
        $qu1 = createQuery(preg_replace("/@/", "\\@", $q1), $u1);
        $qu2 = createQuery(preg_replace("/@/", "\\@", $q2), $u2);
        $qu3 = createQuery(preg_replace("/@/", "\\@", $q3), $u3);

        // push non-empty queries into an array...
        $qu_matches = [];
        $qu1 === '' || array_push($qu_matches, $qu1);
        $qu2 === '' || array_push($qu_matches, $qu2);
        $qu3 === '' || array_push($qu_matches, $qu3);

        /*
         * ...and join them appropriately
         * Recall each query is contained within one set of parenthesis, so the high
         * precedence of the '|' operater causes no trouble here
         */
        return implode(" | ", $qu_matches);
    }

?>