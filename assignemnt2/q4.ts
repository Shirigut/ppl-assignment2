import { map } from 'ramda';
import { Exp, isNumExp, isBoolExp, isPrimOp, isVarRef, isAppExp, Program, isDefineExp, isIfExp, isProcExp, AppExp, isProgram } from '../imp/L3-ast';
import { Result, makeFailure, makeOk, bind, mapResult, safe3, safe2 } from '../shared/result';

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [EXP | Program] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => 
isProgram(exp) ? processProgram(exp.exps): 
isNumExp(exp) ? makeOk(exp.val.toString()) :
isBoolExp(exp) ? makeOk(exp.val ? 'true' : 'false') :
isPrimOp(exp) ? processPrimOp(exp.op) :
isVarRef(exp) ? makeOk(exp.var) :
isAppExp(exp) ? processAppExp(exp) :
isDefineExp(exp) ? bind(l2ToPython(exp.val), val => makeOk(`${exp.var.var} = ${val}`)) :
isIfExp(exp) ? safe3((test: string, then: string, alt: string) =>
makeOk(`(${then} if ${test} else ${alt})`))
(l2ToPython(exp.test), l2ToPython(exp.then), l2ToPython(exp.alt)) :
isProcExp(exp) ? bind(mapResult(l2ToPython, exp.body), body =>
makeOk(`(lambda ${map(arg => arg.var, exp.args).join(",")} : ${processBody(body)})`)) :
makeFailure("Never");



const processProgram = (exps: Exp[]): Result<string> =>
bind(mapResult(l2ToPython, exps),
exps => makeOk(`${exps.slice(0, -1).join("\n")}\n${exps[exps.length - 1]}`));


const processBody = (body: string[]): string =>
body.length === 1 ? body[0] :
`{${body.slice(0, -1).join("; ")}; return ${body[body.length - 1]};}`;
const processPrimOp = (op : string) : Result<string> =>
op === "=" ? makeOk("==") :
op === "not" ? makeOk("not") :
op === "or" ? makeOk("or") :
op === "and" ? makeOk("and") :
op === "eq?" ? makeOk("==") :
op === "number?" ? makeOk("(lambda x : (type(x) == int or type(x) == float))") :
op === "boolean?" ? makeOk("(lambda x : (type(x) == bool))") :
makeOk(op);

const processAppExp = (exp: AppExp): Result<string> =>
isPrimOp(exp.rator) && exp.rator.op === "not" ? 
bind(mapResult(l2ToPython,exp.rands), rands => makeOk(`(not ${rands[0]})`)) :
isPrimOp(exp.rator) ? 
    (["number?","boolean?"].includes(exp.rator.op) ?
    safe2((rator: string, rands: string[]) =>
    makeOk(`${rator}(${rands[0]})`)) (l2ToPython(exp.rator), mapResult(l2ToPython, exp.rands)) :

    ["eq?","=", "and", "or", ">", "<"].includes(exp.rator.op) ?
    safe2((rator: string, rands: string[]) => makeOk(`(${rands[0]} ${rator} ${rands[1]})`))
    (l2ToPython(exp.rator), mapResult(l2ToPython, exp.rands)):

    safe2((rator: string, rands: string[]) => makeOk(`(${rands.join(` ${rator} `)})`))
    (l2ToPython(exp.rator), mapResult(l2ToPython, exp.rands))):

safe2((rator: string, rands: string[]) =>
makeOk(`${rator}(${rands.join(",")})`))
(l2ToPython(exp.rator), mapResult(l2ToPython, exp.rands));


