/**
 * 兼容Logo的变量
 */
let pi = π;

/**
 * 基本指令
 */
class Cmd{
    constructor(name){
        this.name = name;
        this.__pp_name = Symbol("param");
    }

    set param(p){this[this.__pp_name] = p;}
    get param(){return this[this.__pp_name];}

    get sub_cmd(){return this._subcmd_;}
    set sub_cmd(cmd){this._subcmd_ = cmd;}
}

/**
 * 绘画指令
 */
class DrawCmd{
    constructor({type="path",pen=null,a=0,b=0,pos=null,name=""}={}){
        this.type = type;
        if(pen!=null){
            this.path=[new Vector2D(pen.pos)];
            this.lineColor = pen.penColor;
            this.lineWidth = pen.penWidth;
            this.angle = pen.angle;
        }
        if(pos) this.pos = new Vector2D(pos);
        if(a!=0&&b!=0) this.a = a;this.b=b;
        if(name!="") this.name = name;
    }
}
/**
 * 画笔状态
 */
class PenStatu{
    constructor(pos){
        this.penDown = true;        //落笔状态
        this.penColor = "white";
        this.penWidth = 1;
        this.pos= new Vector2D(pos);
        this.angle=0;
        this.isShow = true;
        this.style = 0;
    }
}

class Num{
    constructor(n){
        this._v=NaN;
        this._s=0;//随机数开始
        this._e=0;
        this.type="number";
        this.val = n;
    }
    get val(){
        switch(this.type){
            case "number": return this._v;
            case "random": return RANDOM(this._s,this._e);
            //case "variable":return 0;
            case "repcount":return eval(this._v.replace(/repcount/ig,this._s));
        }
    }
    set val(arr){
        let w = Array.isArray(arr)?arr[0]:arr;
        if(typeof w =="string" && w.includes("repcount")){
            this._v = w;this.type="repcount";arr.shift();
        }else if(typeof w =="string" && w.includes(":")){
            this._v = 0;
            this.type="variable";
            this._variable = Array.isArray(arr)?arr.shift():arr;
        }else if(w=="random"){
            this._v = 0;
            this.type = arr.shift();
            let a=arr[0];
            let b = arr[1];
            try{
                if(!Number.isFinite(a)) a = eval(a);
            }catch(e){a = NaN;}
            try{
                if(!Number.isFinite(b)) b = eval(b);
            }catch(e){b = NaN;}
            
            arr.shift();
            if(Object.is(NaN,b)||Object.is(undefined,b)){
                this._s=0;this._e=a;
            }else{
                this._s=a;this._e=b;arr.shift();
            }
        }else if(Number.isFinite(arr)){
            this._v = arr;this.type = "number";
        }else{
             try{this._v = eval(arr[0]);arr.shift();}catch(e){this._v=NaN;}
             this.type = "number";
        } 
    }
}

//词法工具
class PCLogo{
    constructor(){
        //NOTE:注册各指令模式
        /**
         * 注册无参 并终结指令
         */
        this.COMMEND_P0END = new Set(["stamprect","$undo","$redo"]);
        /**
         * 注册无参指令
         */
        this.COMMEND_P0 = new Set(["pu","pd","ht","st","home","cs","draw","clean","ct","width","random","getxy","xcor","ycor","who","fill"]);
        /**
         * 注册1参指令
         */
        this.COMMEND_P1 = new Set(["fd","lt","rt","bk","test","wait","$turtle","setx","sety","seth"]);
        /**
         * 注册1参 并终结指令
         */
        this.COMMEND_P1END = new Set(["help","?"]);
        // /**
        //  * 注册2参指令
        //  */
        // this.COMMEND_P2 = new Set(["stampoval"]);
        /**
         * 注册可变数量数字参数指令
         */
        this.COMMEND_PLIST = new Set(["setbg","setpc","stampoval","setw","tell","tellall","setxy"]);
        /**
         * 注册特殊指令(处理器与名字相同)
         */
        this.COMMEND_SP = new Set(["rp","to","ask","each","for"]);
        /**
         * 所有可用的指令
         */
        this.COMMEND = [...this.COMMEND_P0,...this.COMMEND_P0END,...this.COMMEND_P1,...this.COMMEND_P1END,/*...this.COMMEND_P2,*/...this.COMMEND_PLIST,...this.COMMEND_SP];

        /**
         * 用户自定义过程
         */
        this.CusFun = new Map();

        this.KeyWord = new Set(["[","]"]);
        this.Lexical = new Map();
        this.__InitLexical();

        this.cmd_history=new Map();
        
        /* 转义、国际化翻译用字典 *//*NOTE: 全称命令化简配置*/
        this._cmd_map = new Map([["repeat","rp"],["\\?","help"],["right","rt"],["left","lt"],["forward","fd"],["back","bk"],["setpencolor","setpc"],["setpensize","setw"]
            ,["$ud","$undo"],["$rd","$redo"]
        ]);

        this.isInCustomProcess = false;

        //加载历史命令记录
        let h_cmd = JSON.parse(localStorage.getItem("weblogo_cmd_history"))||[];
        for(let c of h_cmd) this.cmd_history.set(c,false);
    }

    i18n(st){this._cmd_map=new Map([...this._cmd_map,...st]);}
    
    i18nToen(cmd){
        for(let k of this._cmd_map.keys()){
            cmd = cmd.replace(new RegExp(k.replace(/\$/,"\\\$"),"g"),this._cmd_map.get(k));
        }
        return cmd;
    }

    /**
     * 给指令绑定语法格式
     */
    __InitLexical(){
        //this.Lexical
        for(let c of this.COMMEND_P0) this.Lexical.set(c,this.c1);
        for(let c of this.COMMEND_P0END) this.Lexical.set(c,this.c1end);
        for(let c of this.COMMEND_P1) this.Lexical.set(c,this.c1n1);
        for(let c of this.COMMEND_P1END) this.Lexical.set(c,this.c1p1end);
        for(let c of this.COMMEND_PLIST) this.Lexical.set(c,this.c1plist);
        for(let c of this.COMMEND_SP) this.Lexical.set(c,this[c]);
    }

    /**
     * 预处理指令 并分析
     * @param {*用户输入的指令串} cmd 
     */
    compile(cmd){
        //预处理
        cmd = cmd.replace(/(\[|\()/g," $1 ").replace(/(\]|\))/g," $1 ").replace(/\s+/g," ").toLocaleLowerCase();
        cmd = this.i18nToen(cmd);
        cmd = cmd.replace(/\(\s*/g,"(").replace(/\s*\)/g,")").replace(/\s*\*\s*/g,"*").replace(/\s*\/\s*/g,"\/").replace(/\s*\-\s*/g,"-").replace(/\s*\+\s*/g,"+");

        let rsl = this.cmd_history.get(cmd);
        if(!rsl){
            rsl = this.analysis(cmd.match(/[^\s\r\n]+/ig));
            this.cmd_history.set(cmd,cmd.includes("random")?false:rsl);

            //本地存档
            localStorage.setItem("weblogo_cmd_history",JSON.stringify([...this.cmd_history.keys()]));
        }
        return rsl;
    }

    //分析
    analysis(arr){
        //DEBUG:输出指令的解释结果
        //console.debug(arr);

        if(arr == null) return [];

        let word = arr.shift();
        let rsl_cmd=[];
        if(this.KeyWord.has(word)||this.Lexical.has(word)){
            rsl_cmd.push(this.Lexical.get(word).bind(this)(arr,word));
            if(arr.length>0) rsl_cmd.push(...this.analysis(arr));
        }else if(this.CusFun.has(word)){
            rsl_cmd.push(...this.cusprocess(arr,word));
            if(arr.length>0) rsl_cmd.push(...this.analysis(arr));
        }else{
            throw new Error("Unexpected commend "+word);
        }

        return rsl_cmd;
    }

    /**
     * 单一命令模式
     * @param {*输入流} arr 
     * @param {*当前指令名称} word 
     */
    c1(arr,word){return new Cmd(word);}
    c1end(arr,word){arr.length = 0;return new Cmd(word);}

    /**
     * 命令-参数 式指令处理
     * @param {*输入流} arr 
     * @param {*当前指令名称} word 
     */
    c1n1(arr,word){
        let _c = new Cmd(word);
        _c.param = new Num(arr);
        if(Object.is(_c.param.val,NaN)){
            throw new Error(`E00006|${word}`);
        }
        return _c;
    }

    /**
     * 命令-命令 模式，如 help fd
     * @param {*输入流} arr 
     * @param {*当前指令名称} word 
     */
    c1p1end(arr,word){
        let _c = new Cmd(word);
        _c.param = arr.shift();
        arr.length = 0;
        return _c;
    }

    //一个数字或者3个数字的数组 如 cmd [12 34 56] 或 cmd 3
    c1plist(arr,word){
        let _c=new Cmd(word);
        _c.param=this.numlist(arr);
        return _c;
    }

    numlist(arr){
        let tArr = [];
        if(arr[0]=="["){
            do{
                tArr.push(arr.shift());
            }while(arr.length>0&&arr[0]!="]");
            tArr.shift();
            arr.shift();
        }else{
            tArr = arr;
        }
        let rsl = [];
        let tn;
        do{
            tn = new Num(tArr);
            if(Object.is(tn._v,NaN)) break;
            rsl.push(tn);
        }while(tArr.length>0);
        return rsl;
    }

    //解释用户自定义过程
    cusprocess(arr,word){
        let c = this.CusFun.get(word);
        let param = arr.splice(0,c.param.length);
        let __cmd = c.codeblock.concat();
        for(let i = 0;i<c.param.length;i++){
            for(let j=0;j<__cmd.length;j++){
                __cmd[j] = __cmd[j].replace(new RegExp(c.param[i],"g"),param[i]);
            }
        }
        return this.analysis(__cmd);
    }

    /**
     * 块状代码
     * @param {*输入流} arr 
     * @param {*指令} _c
     * @param {*开始标记} cbegin 
     * @param {*结束标记} cend 
     * @param {*是否允许嵌套} nesting 
     */
    codeblock(arr,_c,cbegin,cend,nesting=true,isAnalysis = true){
        let lv = 0;
        let childCMD=[];
        let c="";
        do{
            c = arr.shift();
            if(c == cbegin) lv++;
            if(c==cend) lv--;

            if(lv >= 0) childCMD.push(c);
            if(lv >0 && !nesting) throw new Error(`E00002|${_c.name}`);
        }while(arr.length>0 && lv!=-1);

        if(lv>=0){
            throw new Error(`E00004|${cend}`);
        }

        _c.codeblock = childCMD.concat();
        if(isAnalysis)_c.sub_cmd = this.analysis(childCMD);

        return _c;
    }

    __rp_style(arr,type){
        let _c = this.c1n1(arr,type);
        let tk = arr.shift();
        if(tk!=="["){
            throw new Error("Expected token [ before "+tk);
        }
        return this.codeblock(arr,_c,"[","]")
    }
    rp(arr){return this.__rp_style(arr,"rp");}
    ask(arr){return this.__rp_style(arr,"ask");}

    to(arr){
        let _c = new Cmd("to");
        let funName = arr.shift();
        if(this.COMMEND.includes(funName)) throw new Error(`E00003|${funName}`);
        _c.param = [];
        while(/^:{1}.*$/.test(arr[0])){
            _c.param.push(arr.shift());
        }
        this.isInCustomProcess = true;
        this.codeblock(arr,_c,"to","end",false,false);
        this.isInCustomProcess = false;
        this.CusFun.set(funName,_c);
        return _c;
    }
    
    for(arr){
        let _p = new Cmd("for");
        if(arr.shift() == "[")  this.codeblock(arr,_p,"[","]",false,false);
        let _cmd = new Cmd("for");
        if(arr.shift() == "[")  this.codeblock(arr,_cmd,"[","]",true,false);
        _cmd.param = _p.codeblock.concat();
        //TODO:语法分析及参数大小判断
        return _cmd;
    }
}

//指令逻辑控制
class WebLogo{
    constructor(home){
        this.La = new PCLogo();
        Object.assign(this,exFun);

        let directCmd=["ct","$undo","$redo"];
        let dCFun = (c)=>{this.drawCmds[this.curPen]=[new DrawCmd({type:c.name})];}
        for(let cf of directCmd){
            this[cf]=dCFun;
        }

        this.fun = new Map();
        let tF = (cmd)=>{throw new Error(`E00001|${cmd.name}`);}
        for(let c of this.La.COMMEND){
            this.fun.set(c, this[c] || tF);            
        }

        this.i18n = this.La.i18n.bind(this.La);

        //常量设置
        /*
            0  black	 1  blue	 2  green	 3  cyan
            4  red		 5  magenta	 6  yellow	 7 white
            8  brown	 9  tan		10  forest	11  aqua
            12  salmon	13  purple	14  orange	15  grey
        */
        this.color_list = ["black","blue","green","cyan","red","magenta","yellow","white","brown","tan","forest","aqua","salmon","purple","orange","grey"];


        //当前绘画环境
        this.bgColor = "black";
        this.sln = 1; //step longth
        this.homePos = new Vector2D(home);
        this.drawCmds = [];

        this.pens=[new PenStatu(home)]; //所有笔的状态
        this.activePens=[0];        //激活的画笔（多笔同步作画）
        this.curPen = 0;            //当前画笔
        this.isMultiPen = false;    //多画笔模式
    }
    
    get angle(){return this.__ag__;}
    set angle(ag){
        if(ag >= 360) ag = ag%360;
        while(ag < 0) ag += 360;
        this.__ag__ = ag;
    }
    ___satrPen(penid){
        this.drawCmds[penid] = [new DrawCmd({pen:this.pens[penid]})];
        return true;
    }


    /**
     * 将简单指令转换为绘画指令
     * @param {*基本指令序列} cmd 
     * @param {*当前角度} curAngle 
     * @param {*当前位置} pos 
     */
    do(cmd){
        let cmdObj = this.La.compile(cmd);

        this.pens.every((v,i)=>this.___satrPen(i));
        this.activePens.forEach(v=>{
            this.curPen = v;
            this.exe(cmdObj);            
        });

        //清理只有起点的路径
        let rsl = [];
        this.drawCmds.forEach((pc,idx)=>pc.forEach(c=>{
            if(c.type == "path" && c.path.length <=1);else{
                if(rsl[idx]==undefined) rsl[idx]=[];
                rsl[idx].push(c);
            }
        }));

        return rsl;//{path:this.temp_path,status:this.status};
    }

    exe(cmd){
        for(let c of cmd){
            this.fun.get(c.name).bind(this)(c);
        }
    }

    /* **************LOGO 绘画指令 ****************/
    ___drawHelp(){
        let pen = this.___getCurPen();
        if(pen.penDown){
            let dCmd = this.drawCmds[this.curPen][this.drawCmds[this.curPen].length - 1];
            if(dCmd.lineColor != pen.penColor || dCmd.lineWidth != pen.penWidth){
                let __dcmd = new DrawCmd({pen : pen});
                __dcmd.path[0].Copy(dCmd.path[dCmd.path.length - 1]);
                this.drawCmds[this.curPen].push(__dcmd);
                dCmd = __dcmd;
            }
            dCmd.path.push(new Vector2D(pen.pos));
        }
    }

    fd(cmd){
        let ag = DEG2RAG(this.___getCurPen().angle);
        let l = cmd.param.val*this.sln;
        this.___getCurPen().pos.AddIn(new Vector2D(Math.cos(ag)*l,Math.sin(ag)*l));
        this.___drawHelp();
    }
    bk(cmd){
        let ag = DEG2RAG(this.___getCurPen().angle);
        let l = cmd.param.val*this.sln;
        this.___getCurPen().pos.MinusIn(new Vector2D(Math.cos(ag)*l,Math.sin(ag)*l));
        this.___drawHelp();
    }

    lt(cmd){this.___getCurPen().angle -= cmd.param.val;}
    rt(cmd){this.___getCurPen().angle += cmd.param.val;}

    rp(cmd){/*repeat*/
        for(let i=0;i<cmd.param.val;i++){
            cmd.sub_cmd.every(c=>{if(c.param.type=="repcount")c.param._s = i;return true;});
            this.exe(cmd.sub_cmd);
        }
    }
    stampoval(cmd){
        if(cmd.param.length != 2)throw new Error(`E00007|${cmd.name}`);
        this.drawCmds[this.curPen].push(new DrawCmd({type:"stampoval",a:cmd.param[0].val,b:cmd.param[1].val,pos:this.___getCurPen().pos,pen:this.___getCurPen()}));
    }

    /* **************画笔 操作指令 ****************/
    ___getCurPen(){return this.pens[this.curPen];}
    pu(){this.___getCurPen().penDown = false;}
    pd(){
        this.___getCurPen().penDown = true;
        this.drawCmds[this.curPen].push(new DrawCmd({pen:this.___getCurPen()}));
    }

    ___getColor(cmd){
        let [a,b={val:0},c={val:0}] = cmd.param;
        a = a.val;        b = b.val;        c = c.val;
        let colorResult = "";
        if(cmd.param.length == 1&& a>=0&&a<this.color_list.length){
            colorResult= this.color_list[a];
        }else if(cmd.param.length == 3&&Math.max(a,b,c)<=100){
            colorResult = RGBA([a,b,c]);
        }else{
            throw new Error("E00005");
        }
        return colorResult;
    }
    setbg(cmd){this.bgColor = this.___getColor(cmd);}
    setpc(cmd){this.___getCurPen().penColor = this.___getColor(cmd);}

    setw(cmd){this.___getCurPen().penWidth = cmd.param[0].val;}
    width(){
        let r = new DrawCmd({type:"help"});
        r.help_text="Result:"+this.___getCurPen().penWidth;
        this.drawCmds[this.curPen]=[r];
    }
    who(){
        let r = new DrawCmd({type:"help"});
        r.help_text="Result:"+this.activePens.join();
        this.drawCmds[this.curPen]=[r];
    }
    /* ****************** 编程指令 ****************/
    to(cmd){}
    random(cmd){}
    for(cmd){
        let variable = cmd.param[0];
        let __star = cmd.param[1]*1;
        let __end = cmd.param[2]*1;
        let __step = (cmd.param[3]||1)*1;

        let v = new RegExp(`:${variable}`,"gm");
        for(let i = __star;i<__end;i+=__step){
            this.exe(this.La.analysis(cmd.codeblock.map(c=>c.replace(v,i))));
        }
        
    }

    /* **************LOGO 操作指令 ****************/
    seth(cmd){this.___getCurPen().angle = cmd.param.val;}
    setx(cmd){
        this.___getCurPen().pos.Copy(new Vector2D(this.homePos.x+cmd.param.val,this.___getCurPen().pos.y));
        this.___drawHelp();
    }
    sety(cmd){
        this.___getCurPen().pos.Copy(new Vector2D(this.___getCurPen().pos.x,this.homePos.y-cmd.param.val));
        this.___drawHelp();
    }
    setxy(cmd){
        this.___getCurPen().pos.Copy(new Vector2D(this.homePos.x+cmd.param[0].val,this.homePos.y-cmd.param[1].val));
        this.___drawHelp();
    }
    home(cmd){
        this.___getCurPen().angle = 0;
        this.___getCurPen().pos.Copy(this.homePos);
        this.___drawHelp();
    }
    clean(cmd){
        this.drawCmds[this.curPen] = [new DrawCmd({type:"cs"})];
        this.drawCmds[this.curPen].push(new DrawCmd({pen:this.___getCurPen()}));
    }
    cs(cmd){
        this.home();
        this.clean();       
    }
    draw(cmd){
        this.pens.forEach((p,i)=>{
            this.curPen = i;
            this.cs();
        });
        this.pens = [new PenStatu(this.homePos)];
        this.curPen = 0;
        this.activePens=[0];

        let bg = new Cmd()
        bg.param = [new Num(0)];
        this.setbg(bg);
        let pc = new Cmd();
        pc.param = [new Num(7)];
        this.setpc(pc);
        this.isMultiPen = false;
    }

    /* **************命令窗相关 操作指令 ****************/
    help(cmd){
        if(typeof this.__helpRsl == "undefined") this.__helpRsl = new Map();
        let r = this.__helpRsl.get(cmd.param);
        if(r == undefined){
             r = new DrawCmd({type:"help"});
             r.help_text="Sorry, Can't find the manual.";
             if(!cmd.param){
                 r.help_text="<span class='help_cmd'>"+this.La.COMMEND.sort().join("</span><span class='help_cmd'>").toUpperCase()+"</span>";
             }else{
                /* await GetURL({url:`../WebLogo/helpfiles/${cmd.param}.txt`,type:"text",method:"GET",async:false})
                 .then((t)=>{console.log(2);r.help_text=`<pre>${t}</pre>`}).catch((t)=>{throw new Error(t)});*/
                LoadResources({
                    url:`helpfiles/${cmd.param}.txt`
                    ,success:(t)=>{r.help_text=`<pre>${t}</pre>`}
                    ,error:(t)=>{r.help_text="Can't find the manual.";},async:false
                });
             }
             this.__helpRsl.set(cmd.param,r);
        }
        this.drawCmds[this.curPen] = [r];
    }

    /* **************多龟指令 处理指令 ****************/
    ask(cmd){
        this.curPen = cmd.param.val;
        this.activePens = [this.curPen];
        if(!this.___getCurPen()){
             this.pens[this.curPen] = new PenStatu(this.homePos);
             this.drawCmds[this.curPen]=[new DrawCmd({pen:this.___getCurPen()})];
        }
        this.exe(cmd.sub_cmd);
    }

    tell(cmd){
        this.isMultiPen = true;
        this.activePens = [];
        cmd.param.map(c=>{
            if(this.pens[c.val] == undefined) this.pens[c.val]=new PenStatu(this.homePos);
            this.activePens.push(c.val);
        });
    }
    tellall(cmd){
        this.isMultiPen = true;
        this.activePens = [];
        let a = cmd.param[0].val;
        let b = cmd.param[1].val;
        for(let p = Math.min(a,b);p<=Math.max(a,b);p++){
            if(this.pens[p] == undefined) this.pens[p]=new PenStatu(this.homePos);
            this.activePens.push(p);
        }
    }

    /* **************扩展指令 与logo不兼容的指令 ****************/
    //更换海龟的样子
    $turtle(cmd){
        this.___getCurPen().style = cmd.param.val;
    }
}

class GameHelper{
    constructor(gameEngine){
        this.version = [2,3,1];
        this.ge = gameEngine;
        let w = this.ge.run.width/2;
        let h = this.ge.run.height/2
        this.pclogo = new WebLogo(new Vector2D(w,h));      
        this.cmdLength = 0;
        this.cmdIndex = 0;
        this.turtleHouse = [];

        this.ge.one("jGE.Scene.Logo.End",this.start.bind(this));

        //NOTE: 默认ERROR信息配置
        this.errInfo =new Map([
                    ["E00001","Comment '$1' not supported,maybe you can try it on the latest version."]
                    ,["E00002","Comment '$1' can't be nesting,try help $1 for more information."]
                    ,["E00003","'$1' is already in use. Try a different name."]
                    ,["E00004","SyntaxError:missing '$1' after commends."]
                    ,["E00005","Error:illegal of color setting,use help for more info."]
                    ,["E00006","Illegal number after '$1'."]
                    ,["E00007","'$1' need two number as param,use 'help $1' for more info."]
                ]);

        this.l10n();
        this.deliverer = new Map();
        this.__initDeliver();

        this.__docmdlist = [];
        this.__dolist = [];
        this.curDoIndex = -1;
    }

    get cmds(){
        let cmds = [...this.pclogo.La.cmd_history.keys()];
        if(cmds.length != this.cmdLength){
            this.cmdIndex = cmds.length;
            this.cmdLength=cmds.length;            
        }
        return cmds;
    }

    getLastCmd(){
        let cmds = this.cmds;
        this.cmdIndex--;
        if(this.cmdIndex<0)this.cmdIndex=this.cmdLength-1;
        return cmds[this.cmdIndex]||"";
    }

    getNextCmd(){
        let cmds = this.cmds;
        this.cmdIndex++;
        if(this.cmdIndex>=this.cmdLength)this.cmdIndex=0;
        return cmds[this.cmdIndex]||"";
    }

    //创建海龟
    turtleBirth(curPos,style=0){
        if(curPos == undefined) curPos = this.pclogo.home;
        let turtle = {
            obj:this.turtleMaker(curPos,style),
            pos:new Vector2D(curPos),
            angle:0,            //角度 0 90 180 270
            showStyle:style,
            showColor:"white",
            myShowItem : []
            ,goto(pos,angle){
                this.pos.Copy(pos);
                this.obj.Copy(pos);
                this.angle = angle;
                this.obj.angle = DEG2RAG(angle)+π/2;
            }
        };
        this.ge.add(turtle.obj);
        return turtle;
    }

    turtleMaker(basePose,style){
        let turtleObj = new ShowObj(basePose);
        turtleObj.index = 1000+this.turtleHouse.length;
        let turtleStyle=[,'🐙','🐞','🐾','😼','📍','🎃','👽','👻','🐼','🐶','🍁','🍀','🐷','🌸','🍄'];
        let curStyle = turtleStyle[style];
        switch(style){
            case 0:
                let b_l = 1.25;
                turtleObj.add(new $tk_path({styleType:'stroke',style:`white 1` ,points:[
                    [-4*b_l,2*b_l],[-2*b_l,4*b_l],[2*b_l,4*b_l],[4*b_l,2*b_l],[4*b_l,-2*b_l],[2*b_l,-4*b_l],[-2*b_l,-4*b_l],[-4*b_l,-2*b_l],-1
                ]}));
                turtleObj.add(new $tk_path({styleType:'stroke',style:`white 1` ,points:[[-1*b_l,5*b_l],[1*b_l,5*b_l]]}));
                turtleObj.add(new $tk_path({styleType:'stroke',style:`white 1` ,points:[[0*b_l,5*b_l],[2*b_l,7*b_l]]}));        
                turtleObj.add(new $tk_path({styleType:'both',style:{fillStyle:"white",strokeStylest:"white 1"} ,points:[[-3*b_l,-4*b_l],[-3*b_l,-8*b_l],[-1*b_l,-10*b_l],[-1*b_l,-6*b_l],-1]}));
                turtleObj.add(new $tk_path({styleType:'both',style:{fillStyle:"white",strokeStylest:"white 1"} ,points:[[3*b_l,-4*b_l],[3*b_l,-8*b_l],[1*b_l,-10*b_l],[1*b_l,-6*b_l],-1]}));
                turtleObj.add(new $tk_path({styleType:'stroke',style:`white 1` ,points:[[-1*b_l,-10*b_l],[1*b_l,-10*b_l]]}));
                turtleObj.add(new $tk_path({styleType:'stroke',style:`white 1` ,points:[[-4*b_l,2*b_l],[-6*b_l,4*b_l],[-4*b_l,5*b_l],[-3*b_l,3*b_l]]}));
                turtleObj.add(new $tk_path({styleType:'stroke',style:`white 1` ,points:[[4*b_l,2*b_l],[6*b_l,4*b_l],[4*b_l,5*b_l],[3*b_l,3*b_l]]}));
                turtleObj.add(new $tk_path({styleType:'stroke',style:`white 1` ,points:[[4*b_l,-2*b_l],[6*b_l,-4*b_l],[4*b_l,-5*b_l],[3*b_l,-3*b_l]]}));
                turtleObj.add(new $tk_path({styleType:'stroke',style:`white 1` ,points:[[-4*b_l,-2*b_l],[-6*b_l,-4*b_l],[-4*b_l,-5*b_l],[-3*b_l,-3*b_l]]}));
                break;
            default :
                turtleObj.add(new $tk_font({text:curStyle,styleType:'fill',style:'rgba(255,0,0,1)',font:'16px serif',pos:[0,0]}));
                break;
        }

        return turtleObj;
    }

    start(){
        this.updateTurtles();

        //环境初始化
        this.ShowResult(`Welcome to Web Turtle [ver ${this.version.join(".")}]`);
        this.ShowResult("Copyright © VMWed.COM 2017");
        this.ShowResult("Try 'help' or '?' for more information.");
        this.ShowResult("说明（临时）：https://github.com/C0618C/jGE/blob/master/WebTurtle/README.md")
        this.ShowResult("　");
        let ip_bar = document.getElementById("cmd_input");
        ip_bar.removeAttribute("disabled");
        ip_bar.focus();
    }

    do(cmd){
        let ___lastPos = this.pclogo.___getCurPen().pos.Cloen();
        let ___ag = this.pclogo.___getCurPen().angle;
        let cmdQueue = this.pclogo.do(cmd);

        this.updateTurtles();

        let hasDraw = cmdQueue.every((dCmd,i)=>{
            let newpath = new ShowObj(0,0);
            let isDraw = true;
            for(let dC of dCmd){
                switch(dC.type){
                    case "path":
                        if(dC.path.length == 1){
                            console.debug("监控到只有一个点的路径");
                            continue;
                        }
                        newpath.add(new $tk_path({styleType:'stroke',style:`${dC.lineColor} ${dC.lineWidth} round round` ,points:dC.path}));// round round
                        break;
                    case "stampoval":
                        let ellipseObj = new ShowObj(dC.pos);
                        ellipseObj.angle = DEG2RAG(dC.angle)+π/2;
                        ellipseObj.add(new $tk_ellipse({styleType:'stroke',style:`${dC.lineColor} ${dC.lineWidth}` ,a:dC.a,b:dC.b}));// round round
                        this.turtleHouse[i].myShowItem.push(ellipseObj);
                        this.ge.add(ellipseObj);
                        break;
                    case "cs":
                        for(let s of this.turtleHouse[i].myShowItem) s.isDel = true;
                        newpath = new ShowObj(0,0);
                        this.turtleHouse[i].myShowItem = [];
                        break;
                    default:
                        if(this.deliverer.has(dC.type)){
                            this.deliverer.get(dC.type)(dC);
                            isDraw = false;
                        }else
                            console.warn("尚未实现绘画逻辑："+dC.type);
                        break;
                }
                if(!isDraw) return false;
            }
            this.turtleHouse[i].myShowItem.push(newpath);
            this.ge.add(newpath);

            this.__docmdlist.push(cmd);
            this.__dolist.push({line:newpath,pos:___lastPos,ag:___ag});
            this.curDoIndex++;
            return true;
        });
        this.ge.backgroundColor = this.pclogo.bgColor;

    }

    __initDeliver(){
        this.deliverer.set("help",(dC)=>this.ShowResult(dC.help_text,{help:true}));
        this.deliverer.set("ct",()=>this.ShowResult("",{cls:true}));    //清除命令栏内容
        this.deliverer.set("$undo",()=>{
            let curSet = this.__dolist.pop();
            curSet.line.isDel = true;
            this.pclogo.___getCurPen().pos.Copy(curSet.pos);
            this.pclogo.___getCurPen().angle = curSet.ag;
            this.curDoIndex--;
            this.updateTurtles();
        });
        this.deliverer.set("$redo",()=>{
            if(this.curDoIndex+1>=this.__docmdlist.length) return;
            this.curDoIndex++;
            this.do(this.__docmdlist[this.curDoIndex]);
        });
    }

    updateTurtles(){
        let activeTurtle = new WeakMap();
        this.pclogo.pens.map((p,i)=>{
            let t = this.turtleHouse[i] || (this.turtleHouse[i] = this.turtleBirth(undefined,i));

            if(t.showStyle != p.style){
                this.ge.del(t.obj);
                t.showStyle = p.style;
                t.obj = this.turtleMaker(p.pos,p.style);
                this.ge.add(t.obj);
            }

            if(t.showStyle == 0 && p.penColor != t.showColor){
                for(let l of t.obj){
                    if(l.styleType == "stroke"){
                        l.setStyle(`${p.penColor} 1`);
                    }else if(l.styleType =="both"){
                        l.setStyle({fillStyle:p.penColor,strokeStylest:`${p.penColor} 1`});
                    }
                }
                t.showColor = p.penColor;
            }

            t.goto(p.pos,p.angle);
            activeTurtle.set(t,"");
        });
        this.turtleHouse.map(t=>{
            if(!activeTurtle.has(t)) t.obj.isDel = true;
        });
    }

    ShowResult(text,{error=false,help=false,cls=false}={}){
        let cmd_win = document.getElementById("cmd_log");
        let p = document.createElement("p");
        p.textContent = text;
        if(cls){cmd_win.textContent="";return;}
        if(error){
            p.style.color="#a94442";
            let [errcode,...errparam] = text.split("|");
            let errText = this.errInfo.get(errcode)||errcode;
            errparam.map((param,index)=>errText=errText.replace(new RegExp("\\$"+(index+1),"g"),param));
            p.innerHTML = errText;
        }else if(help){
            p.innerHTML = text;
        }
        cmd_win.appendChild(p);
        cmd_win.scrollTop = cmd_win.scrollHeight;
    }

    l10n(){
        let curLang = navigator.language;
        if(curLang.includes("en")) return;        //curLang = "ru";     //测试的俄语
        GetURL({url:`i18n/${curLang}.js`,type:"script"})
        .then((rsl)=>{
            if(typeof web_logo_i18n != "undefined"){//本地化处理
                this.pclogo.i18n(web_logo_i18n.cmd);
                this.errInfo = new Map([...this.errInfo,...web_logo_i18n.err]);
                console.debug(`已装载本地语言：${web_logo_i18n.name}。`);
                web_logo_i18n = null;
            }
        })
        .catch((e)=>console.warn(`本地化失败:找不到语言${curLang}.`));
    }
}

(function(){
    let KeyMap = new Map([[13,"Enter"],[38,"Up"],[40,"Down"]]);

    let cmd_show_height=222+20;
    let myHeight = document.documentElement.clientHeight-cmd_show_height+130;
    let x = new jGE({width:document.documentElement.clientWidth,height:myHeight});
    let game = new GameHelper(x);

    let vp = document.getElementById("view_port");
    vp.appendChild(x.GetDom());
    vp.style.height = myHeight+"px";
    document.getElementById("cmd").style.width=document.documentElement.clientWidth+"px";
    let cmd_win = document.getElementById("cmd_log");
    cmd_win.style.width = document.documentElement.clientWidth+20+"px";
    let ip_bar = document.getElementById("cmd_input");
    ip_bar.addEventListener("keyup",function(event){
        if(KeyMap.get(event.keyCode) == "Enter"){
            let cmd = this.value.replace(/\r|\n/," ");
            
            game.ShowResult(cmd);            
            this.value = "";
            try{
                game.do(cmd);
            }catch(e){
                game.ShowResult(e.message,{error:true});
                console.error(e);
            }
        }else if(KeyMap.get(event.keyCode) == "Up"){
            this.value =game.getLastCmd();
        }else if(KeyMap.get(event.keyCode) == "Down"){
            this.value =game.getNextCmd();
        }
    });
    
    //DEBUG:抛出Weblogo
    window.weblogo = game;
})();

function DEG2RAG(ag){
    return π*ag/180-π/2;//-0.5π是为了将y轴正方形朝下
}

function RGBA(arr){
    let r = Math.floor(255*arr[0]/100);
    let g = Math.floor(255*arr[1]/100);
    let b = Math.floor(255*arr[2]/100);
    let a = arr[3];
    if(a == undefined) a = 1;
    return `rgba(${r},${g},${b},${a})`;
}

function RANDOM(a,b){
    let rd = (n)=>Math.floor(Math.random()*1000%n);
    return rd(b-a+1)+a;
}

