import { ClassExp, ProcExp,  Exp, Program, isClassExp, CExp, isAtomicExp, isLitExp, isIfExp, isAppExp, isProcExp, isLetExp, isCExp, isDefineExp, isExp, isProgram, 
    makeDefineExp, makeProcExp, makePrimOp, makeIfExp, makeProgram, makeVarDecl, VarDecl, makeAppExp, makeLetExp, makeBinding, 
    makeBoolExp, makeStrExp, makeLitExp } from "./L31-ast";
import { Result, makeFailure, makeOk } from "../shared/result";
import { map} from "ramda";
import { makeVarRef } from "../imp/L3-ast";



/*
Purpose: function that builds the body of the procedures with the if expressions
Signiture:  makeBodyHelper(string[], CExp[], number, valDecl)
Type: (string[], CExp[], number, valDecl) => CExp
*/

export const makeBodyHelper = (vars: string[], vals: CExp[], index: number, msg: VarDecl): CExp => {
    if (index === vars.length)
       return makeBoolExp(false); 
    else return makeIfExp(makeAppExp(makePrimOp("eq?"), [makeVarRef(msg.var), makeLitExp("'"+ vars[index])]),
         makeAppExp(vals[index], []), 
         makeBodyHelper(vars, vals, index+1, msg));
}

export const makeBody = (vars: string[], vals: CExp[], msg: VarDecl): CExp[] => 
    [makeBodyHelper (vars, vals, 0, msg)];
 
/*
Purpose: Transform ClassExp to ProcExp
Signature: for2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp => {
    const args: VarDecl[] = exp.fields;
    const vars: string[] = map((m)=> m.var.var, exp.methods);
    const vals: CExp[] = map ((m)=> m.val, exp.methods);
    const msg: VarDecl = makeVarDecl("msg");
    return makeProcExp(args, [makeProcExp([msg], makeBody(vars, vals, msg))]);
}


export const rewriteAllClass = (exp: Program | Exp) : Program | Exp => 
    isExp (exp)? rewriteAllClassExp(exp): 
    isProgram (exp)? makeProgram(map(rewriteAllClassExp, exp.exps)):
    exp;

const rewriteAllClassExp = (exp: Exp) : Exp => 
    isCExp (exp)? rewriteAllClassCExp(exp): 
    isDefineExp (exp)? makeDefineExp(exp.var, rewriteAllClassCExp(exp.val)):
    exp;

const rewriteAllClassCExp = (exp: CExp): CExp =>
    isAtomicExp(exp)? exp:
    isLitExp(exp)? exp:
    isIfExp(exp)? makeIfExp(exp.test, rewriteAllClassCExp(exp.then), rewriteAllClassCExp(exp.alt)):
    isAppExp(exp)? makeAppExp(rewriteAllClassCExp(exp.rator), map(rewriteAllClassCExp, exp.rands)):
    isProcExp(exp)? makeProcExp(exp.args, map(rewriteAllClassCExp, exp.body)):
    isLetExp(exp)? makeLetExp(map((m) => makeBinding(m.var.var, rewriteAllClassCExp(m.val)),exp.bindings), map (rewriteAllClassCExp, exp.body)):
    isClassExp(exp)? rewriteAllClassCExp(class2proc(exp)):
    exp;


/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
    makeOk(rewriteAllClass(exp));
