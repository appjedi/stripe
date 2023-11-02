
const form = {
    method: "POST",
    action: "register",
    title: "Register",
    fields: [
        {id: "lastName", name: "lastName", type:"text", placeholder:"Last Name", required:true},
        {id: "firstName", name: "firstName", type:"text", placeholder:"First Name", required:true},
        {id: "midInit", name: "midInit", type:"text", placeholder:"MIDDLE INITIAL/S?:", required:false},
        {id: "address", name: "address", type:"text", placeholder:"FULL STREET ADDRESS WHERE YOU LIVE?:",size:40, required:false},
        {id: "city", name: "city", type:"text", placeholder:"CITY WHERE YOU LIVE?:", size:30,required:false},
        {id: "state", name: "state", type:"text", placeholder:"STATE WHERE YOU LIVE?:", required:false},
        {id: "postCode", name: "postCode", type:"text", placeholder:"ZIP CODE WHERE YOU LIVE?:", required:false},
        {id: "email", name: "email", type:"email", placeholder:"PRIMARY EMAIL ADDRESS?:", size:40, required:true},
        {id: "phone", name: "phone", type:"text", placeholder:"PRIMARY TELEPHONE NUMBER?:", required:true},
        {id: "birthMonth", name: "birthMonth", type:"number", placeholder:"MONTH & YEAR OF BIRTH?:", min:1, max:12,required:true},
        {id: "birthYear", name: "birthYear", type:"number", placeholder:"MONTH & YEAR OF BIRTH?:", min:1900, max:2020,required:true},
        {
            id: "activities", name: "activities", type: "textarea",rows:5, cols:40,
            placeholder: "LIST ANY OTHER  SPORT/S AND/OR CULTURAL ACTIVITIES?  THAT ARE NOT PRIMARY?", required: true
        },
        {id: "memberClubs", name: "memberClubs", type:"textarea",rows:5, cols:40, placeholder:"IF YOU ARE A MEMBER OF ANY CLUBS OR ORGANIZATIONS RELATED TO YOUR SPORT/S AND/OR CULTURAL ACTIVITIES PLEASE LIST THEIR NAME AND THE SPORT/S AND/OR CULTURAL ACTIVITIES THEY RELATE TO", required:true},
        {
            id: "teamsfLiansons", name: "teamsfLiansons", type: "textarea",rows:5, cols:40,
            placeholder: " IF YOU KNOW, PLEASE LIST THE TEAMSF LIAISON/S FOR YOUR SPORT/S AND/OR CULTURAL ACTIVITIES?", required: true
        },

    ]
}
function makeForm(frm)
{
    let t = `<form method='${frm.method}' action='${frm.action}'>\n`;
    for (let f of frm.fields)
    {
        let ft = "";
        //console.log(f);
        let size = f['size'] ?? 20;
        if (f.type === "textarea") {
             ft = `${f.placeholder}<br/><textarea name='${f.name}' id='${f.id}' rows=${f.rows} cols=${f.cols} ${f.required ? 'required' : ''}></textarea>\n`;
        } else {
            ft = `${f.placeholder}:<br/><input type='${f.type}' name='${f.name}' id='${f.id}' ${f.required ? 'required' : ''} size="${size}"`;
            if (f.type === 'number')
            {
                ft += ` min='${f.min}' max='${f.max}'/>\n`
            } else {
                ft += "/>\n";
            }
        }
        
        
        t += "<div>"+ft+"</div>";
    }
    t += "</form>";
    return t;
}
const c = makeForm(form);
console.log(c);