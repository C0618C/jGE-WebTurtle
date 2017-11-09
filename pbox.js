//▓▉⿴¤§♀📦🏢

class Box{
    constructor(...x){
        let [shell,l] = [...x];
        this.box_obj = shell;
        let box_body = new $tk_path({ styleType: 'fill', style: "white", points: [[-l, -l], [-l, l], [l, l], [l, -l], -1] });
        shell.add(box_body);
        
        shell.Done = function(){
            box_body.fillStyle = "yellow";
        }
        shell.UnDone = function(){
            box_body.fillStyle = "white";
        }
    }
    
    get obj (){
        return this.box_obj;
    }
}

class GameMap {
    constructor(data = [[]]) {
        this.obj_type = new Set(["box","target","empty","grass","wall"]);
        this.data = data;
        this.showobject = null;
        this.done = 0;
        this.target_list = new Map();
        this.wall_list = new Map();
        this.box_list = new Map();
        this.grass_list = new Map();
        this.empty_list = new Map();
        this.man = { obj: null, pos: [0, 0] };
        this.width = 0;
        this.height = 0;
        this.cellWitdh = 0;
    }
}

class LogicHelper {
    constructor(map) {
        let check_fun = "";
        for(let o of map.obj_type){
            check_fun +=`if(map.${o}_list.has(pos.toString()))  return Symbol.for("${o}");`;
        }
        this.GetTargetFromPos=new Function("map","pos",`
            ${check_fun}
            return null;
        `);
    }
    move(map, tw, pos) {
        let cp = pos ? pos : map.man.pos.concat();
        let np = cp.concat();
        switch (tw) {
            case Symbol.for("Up"):
                np[1]--;
                break;
            case Symbol.for("Down"):
                np[1]++;
                break;
            case Symbol.for("Left"):
                np[0]--;
                break;
            case Symbol.for("Right"):
                np[0]++;
                break;
        }
        let nextTarget = this.GetTargetFromPos(map,np);
        let rsl = (nextTarget !== Symbol.for("wall") && nextTarget !== Symbol.for("empty"));
        if(nextTarget == Symbol.for("box")){
            if(pos == undefined){
                let {moved,target,new_pos} = this.move(map,tw,np);

                if(moved && target == Symbol.for("target")){
                    moved = moved && !map.box_list.has(new_pos.toString());
                }else if(moved && target != Symbol.for("grass")){
                    moved = false;
                }
                if(moved){
                    let box = map.box_list.get(np.toString());
                    map.box_list.delete(np.toString());
                    map.box_list.set(new_pos.toString(),box);
                }
                rsl = rsl && moved;
            }else{
                rsl = false;
            }
        }
        if(rsl) map.man.pos = np;
        return {moved:rsl,target:nextTarget,new_pos:np};
    }
}


class GameHelper {
    constructor(jGE) {
        this._jGE = jGE;
        this.logicHandler = new LogicHelper(new GameMap());
        this.symbolmapping = new Map();
        this.symbolmapping.set("▉", Symbol.for("wall"));
        this.symbolmapping.set("▓", Symbol.for("empty"));
        this.symbolmapping.set("☉", Symbol.for("target"));
        this.symbolmapping.set("□", Symbol.for("box"));
        this.symbolmapping.set("♀", Symbol.for("man"));
        this.symbolmapping.set("⿴", Symbol.for("grass"));
        this.pens = new Map();
        this.pens.set(Symbol.for("wall"), this.__draw_wall);
        this.pens.set(Symbol.for("empty"), this.__draw_empty);
        this.pens.set(Symbol.for("target"), this.__draw_target);
        this.pens.set(Symbol.for("box"), this.__draw_box);
        this.pens.set(Symbol.for("man"), this.__draw_man);
        this.pens.set(Symbol.for("grass"), this.__draw_grass);
        this.pens.set(Symbol.for("done"), this.__draw_done);

        this.level = new Map();

        this.keyboard = null;
        this.curMap = null;

        this.curLevel = 1;

        this.InitMap();
        this.InitKeyboard();
       
        this._jGE.one("jGE.Scene.Logo.End", () => this.Start());
    }

    InitMap() {
        this.level.set(1, `
▓▓▓▉▉▉▉▉▉▉▓|
▓▉▉▉⿴⿴⿴⿴⿴▉▓|
▉▉☉⿴⿴□▉▉⿴▉▉|
▉☉☉⿴□⿴□⿴⿴♀▉|
▉☉☉⿴⿴□⿴□⿴▉▉|
▉▉▉▉▉▉▉⿴⿴▉▓|
▓▓▓▓▓▓▉▉▉▉▓|
        `);
        this.level.set(2, `
▓▉▉▉▉▉▉▉▓▓|
▓▉⿴⿴⿴⿴⿴▉▉▉|
▉▉□▉▉▉⿴⿴⿴▉|
▉♀⿴⿴□⿴⿴□⿴▉|
▉⿴☉☉▉⿴□⿴▉▉|
▉▉☉☉▉⿴⿴⿴▉▓|
▓▉▉▉▉▉▉▉▉▓|
        `);
        this.level.set(3, `
▓▓▉▉▉▉▓▓▓|
▉▉▉⿴⿴▉▉▉▉|
▉⿴⿴⿴⿴⿴□⿴▉|
▉⿴▉⿴⿴▉□⿴▉|
▉⿴☉⿴☉▉♀⿴▉|
▉▉▉▉▉▉▉▉▉|
        `);
        this.level.set(4, `
▓▉▉▉▉▉▉▉▉▉▓|
▓▉⿴⿴▉▉⿴⿴⿴▉▓|
▓▉⿴⿴⿴□⿴⿴⿴▉▓|
▓▉□⿴▉▉▉⿴□▉▓|
▓▉⿴▉☉☉☉▉⿴▉▓|
▉▉⿴▉☉☉☉▉⿴▉▉|
▉⿴□⿴⿴□⿴⿴□⿴▉|
▉⿴⿴⿴⿴⿴▉⿴♀⿴▉|
▉▉▉▉▉▉▉▉▉▉▉|
        `);
        this.level.set(5, `
▉▉▉▉▉▉▉▓▓|
▉⿴⿴⿴⿴⿴▉▓▓|
▉⿴□□□▉▉▓▓|
▉⿴⿴▉☉☉▉▉▉|
▉▉⿴⿴☉☉□⿴▉|
▓▉⿴♀⿴⿴⿴⿴▉|
▓▉▉▉▉▉▉▉▉|
        `);
        
        
        let draw_model_fun = "";
        for(let o of (new GameMap()).obj_type){
            draw_model_fun +=`
            for (let l of this.curMap.${o}_list.keys()) {
                let so = this.pens.get(Symbol.for("${o}")).bind(this)(l.split(","));
                mapObj.add(so);
                this.curMap.${o}_list.set(l, so);
            };`;
        }
        this.Draw = new Function(`
            let mapObj = new ShowObj({x:100, y:100});//TODO: 计算中心点放到GameMap处理

            ${draw_model_fun}
            this.curMap.man.obj = this.__draw_man(this.curMap.man.pos);
            mapObj.add(this.curMap.man.obj);

            this.curMap.showobject = mapObj;
            this._jGE.add(mapObj);
        `);
    }

    StartLv(lv) {
        if (this.curMap) this.curMap.showobject.isDel = true;
        this.curMap = this.ReadMap(this.level.get(lv));
        this.Draw();
    }

    Start(){
        this.StartLv(5);
        this.keyboard.VirtualKeyboard.visible = true;
        this.keyboard.isEnable = true;
    }


    ReadMap(mapStr) {
        let mapObj = new GameMap();
        let y = 0;
        mapStr.split(/\||\n/).forEach(row => {
            if (/^\s*$/.test(row)) return;
            row.match(/.{1}/g).forEach((cell, x) => {
                if (/^\s*$/.test(cell)) return;
                let obj = this.symbolmapping.get(cell);
                mapObj.data[y].push(obj);
                switch (obj) {
                    case Symbol.for("man"):
                        mapObj.man.pos = [x, y];
                        break;
                    case Symbol.for("box"):
                        mapObj.box_list.set([x, y].toString(), null);
                    case Symbol.for("grass"):
                        mapObj.grass_list.set([x, y].toString(), null);
                        break;
                    case Symbol.for("target"):
                        mapObj.target_list.set([x, y].toString(), null);
                        break;
                    case Symbol.for("wall"):
                        mapObj.wall_list.set([x, y].toString(), null);
                        break;
                    case Symbol.for("empty"):
                        mapObj.empty_list.set([x, y].toString(), null);
                        break;
                };
            });
            mapObj.data[++y] = [];
        });
        mapObj.grass_list.set(mapObj.man.pos.toString(),null);
        mapObj.data.pop();
        if (mapObj.target_list.size != mapObj.box_list.size) {
            console.error("游戏配置出错，箱子与目标数量不相等。请检查地图设置。");
        }

        mapObj.width = Math.max(...mapObj.data.map(i => i.length));
        mapObj.height = mapObj.data.length;
        mapObj.cellWitdh = Math.min(this._jGE.run.width / mapObj.width, this._jGE.run.height / mapObj.height) / 2 >> 0;

        return mapObj;
    }

    __draw_cell(...pos) {
        return new ShowObj(this.GetLocalPos(...pos));
    }
    __draw_wall([i, j]) {
        let l = this.curMap.cellWitdh / 2 >> 0;
        return this.__draw_cell([i, j]).add(new $tk_path({ styleType: 'both', style: { fillStyle: "gray", strokeStylest: "#ddd 1" }, points: [[-l, -l], [-l, l], [l, l], [l, -l], -1] }));
    }
    __draw_box([i, j]) {
        let box=new Box(this.__draw_cell([i, j]),(this.curMap.cellWitdh / 2 >> 0) - 5);
        return box.obj;
    }
    __draw_empty([i, j]) { return this.__draw_cell([i, j]); }
    __draw_grass([i, j]) { return this.__draw_cell([i, j]).add(new $tk_font({ text: "×" })); }
    __draw_man([i, j]) { return this.__draw_cell([i, j]).add(new $tk_font({ text: "🐙", font: `${(this.curMap.cellWitdh * 0.8) >> 0}px 微软雅黑` })); }
    __draw_target([i, j]) { return this.__draw_cell([i, j]).add(new $tk_ellipse({ r: this.curMap.cellWitdh / 3 >> 0 })); }
    __draw_done([i, j]) {
        let l = (this.curMap.cellWitdh / 2 >> 0) - 5;
        return this.__draw_cell([i, j]).add(new $tk_path({ styleType: 'fill', style: "green", points: [[-l, -l], [-l, l], [l, l], [l, -l], -1] }));
    }

    Move(tw) {
        if (this.logicHandler.move(this.curMap, tw).moved){
            let {man:m,box_list:b_l,done,target_list:t_l} = this.curMap;
            m.obj.Copy(new Vector2D(this.GetLocalPos(m.pos)));
            
            b_l.forEach((b,k)=>{
                b.Copy(new Vector2D(this.GetLocalPos(k.split(","))));
                
                if(t_l.has(k)){
                    done++;
                    b.Done();
                }else{
                    b.UnDone();
                }
                
            });
            
            if(done == t_l.size) console.log("Job done,Thx!");
        }
    }
    
    GetLocalPos(...x){
        let i,j;
        if(Array.isArray(...x)){
            [[i,j]]=[...x];
        }else{
            [i,j] = x;
        }
        return {x:i * this.curMap.cellWitdh, y:j * this.curMap.cellWitdh};
    }

    InitKeyboard(){
        const l = 20;
        let pu = new $tk_path({styleType:'both',style:{fillStyle:"green",strokeStylest:"yellow 2"} ,points:[[0,-3*l],[-2*l,2.5*l],[2*l,2.5*l],-1],pos:[0,0]});
        let pd = new $tk_path({styleType:'both',style:{fillStyle:"red",strokeStylest:"white 2"} ,points:[[0,-3*l],[-2*l,2.5*l],[2*l,2.5*l],-1],pos:[0,0]});
        let po = new $tk_path({styleType:'both',style:{fillStyle:"yellow",strokeStylest:"blue 2"} ,points:[[0,-3*l],[-2*l,2.5*l],[2*l,2.5*l],-1],pos:[0,0]});

        let kb = new Keyboard(this._jGE);
        
        kb.add(new Key({
            code:"ArrowUp",
            upObjs:[pu],downObjs:[pd],hoverObj:[po],y:-5*l
        }));
        kb.add(new Key({
            code:"ArrowLeft",
            upObjs:[pu.clone()],downObjs:[pd.clone()],hoverObj:[po.clone()]
            ,x:-5*l,angle:-π_hf
        }));
        kb.add(new Key({
            code:"ArrowRight",
            upObjs:[pu.clone()],downObjs:[pd.clone()],hoverObj:[po.clone()]
            ,x:5*l,angle:π_hf
        }));
        kb.add(new Key({
            code:"ArrowDown",
            upObjs:[pu.clone()],downObjs:[pd.clone()],hoverObj:[po.clone()]
            ,y:5*l,angle:π
        }));

        let KeyMap = new Map([["ArrowUp", Symbol.for("Up")], ["ArrowDown", Symbol.for("Down")], ["ArrowLeft", Symbol.for("Left")], ["ArrowRight", Symbol.for("Right")]]);

        kb.get("ArrowUp").addEventListener("keydown",e=>this.Move(KeyMap.get(e.code)));
        kb.get("ArrowDown").addEventListener("keydown",e=>this.Move(KeyMap.get(e.code)));
        kb.get("ArrowLeft").addEventListener("keydown",e=>this.Move(KeyMap.get(e.code)));
        kb.get("ArrowRight").addEventListener("keydown",e=>this.Move(KeyMap.get(e.code)));

        kb.VirtualKeyboard.AddIn({x:this._jGE.run.width - 200,y:this._jGE.run.height - 200});
        this._jGE.add(kb);
        kb.isEnable = false;
        kb.VirtualKeyboard.visible = false;
        this.keyboard = kb;
    }
}

(function () {

    let myHeight = document.documentElement.clientHeight + 2;
    let x = new jGE({ width: document.documentElement.clientWidth, height: myHeight });
    let game = new GameHelper(x);

    let vp = document.getElementById("view_port");
    vp.appendChild(x.GetDom());

    window.g = game;

})();