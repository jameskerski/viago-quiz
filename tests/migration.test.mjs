import test from "node:test";
import assert from "node:assert/strict";
import { canonical, hashRows, compareRows, TABLES, PK } from "../scripts/migration/lib.mjs";

test("canonical serialization is key-order independent",()=>assert.equal(canonical({b:2,a:1}),canonical({a:1,b:2})));
test("row hashes are deterministic",()=>assert.equal(hashRows([{id:"a",v:1}]),hashRows([{v:1,id:"a"}])));
test("material differences fail parity",()=>assert.equal(compareRows({winner_color:"red"},{winner_color:"blue"}).equal,false));
test("copy order is parent before child",()=>assert.deepEqual(TABLES.slice(0,3),["questions","question_options","quiz_attempts"]));
test("every copied table has a replay key",()=>{for(const table of TABLES)assert.ok(PK[table]?.length);});
