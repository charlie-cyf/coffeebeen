/* tslint:disable:no-console */
import * as fs from "fs";
import * as https from "https";
import {hostname} from "os";
import "mocha"
import {on} from "cluster";


export class ParseHTML{

    public parseData(){
        const parse5 = require("parse5");
        const Jsdom = require("jsdom");
        const { JSDOM } = Jsdom;
        const folder = "./HTMlfiles/";

        function findCompanyName(obj: any) {
            const postingDiv = obj.getElementById("postingDiv").getElementsByClassName("table table-bordered")[2];
            const postingTag = postingDiv.getElementsByTagName("tr")[1].getElementsByTagName("td")[1].innerHTML;
            return postingTag.trim();
        }

        function findCompanyAddress(obj: any){
            var addressline1 = "";
            var addressline2 = "";
            var city = "";
            var zipcode = "";
            var province = "";
            var country = "";
            try{
                const pDiv = obj.getElementById("postingDiv").getElementsByClassName("table table-bordered")[2];
                const l = pDiv.getElementsByTagName("tr").length;
                for(var i =1; i< l; i++){
                    const trele = pDiv.getElementsByTagName("tr")[i];
                    const td0 = trele.getElementsByTagName("td")[0].getElementsByTagName("strong")[0].innerHTML.trim();
                    //console.log(td0);
                    if(td0 === "Address Line 1:"){
                        addressline1 = trele.getElementsByTagName("td")[1].innerHTML.trim()+"\n";
                    }
                    else if (td0 === "Address Line 2:")
                        addressline2 = trele.getElementsByTagName("td")[1].innerHTML.trim()+"\n";
                    else if(td0 === "City:"){
                        city = trele.getElementsByTagName("td")[1].innerHTML.trim()+", ";
                    }else if (td0 === "Postal Code / Zip Code:")
                        zipcode = trele.getElementsByTagName("td")[1].innerHTML.trim();
                    else if (td0 === "Province / State:")
                        province = trele.getElementsByTagName("td")[1].innerHTML.trim()+", ";
                    else if (td0 === "Country:")
                        country = trele.getElementsByTagName("td")[1].innerHTML.trim()+"\n";
                    else {}
                    // else if ()
                }
            }catch (e) {}
            return addressline1+addressline2+city+province+country+zipcode;
        }

        function findHRName(obj:any){
            const postingDiv = obj.getElementById("postingDiv").getElementsByClassName("table table-bordered")[1];
            const postingTag = postingDiv.getElementsByTagName("tr")[3].getElementsByTagName("td")[1].innerHTML;
            return postingTag.trim();
        }

        function findPeriod(obj:any){
            let per = "8 months";
            const postingDiv = obj.getElementById("postingDiv").getElementsByClassName("table table-bordered")[0];
            const postingTag = postingDiv.getElementsByTagName("tr")[6].getElementsByTagName("td")[1].innerHTML.trim();
            if (postingTag === "4 months")
                per = postingTag;
            return per;
        }

        const getGender = function(url: any): Promise<any> {
            return new Promise<string>(async function (fulfull, reject) {
                let result = "Ms.";
                https.get(url, async (res)=>{
                    const statusCode = res.statusCode;
                    if (statusCode !== 200) {
                        console.log("cannot get gender from API");
                        res.resume();
                    }
                    res.setEncoding("utf8");
                    let rawData = "";
                    await res.on("data", (chunk: any)=> { rawData += chunk;})
                        .on("end", async () => {
                            try {
                                const parsedData = await JSON.parse(rawData);
                                const ans = parsedData.gender;
                                if (ans === "male")
                                    result = "Mr.";
                                fulfull(result);
                            } catch (e) {
                                console.log("gender api error!");
                                reject(e.message);
                            }
                        }).on("error", (e:any) => {
                            console.log(`gender api error! ${e.message}`);
                            reject(e.message);
                        });
            });

            });
        };

        function getDate() {
            let d = new Date();
            let months = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return months[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();
        }

        async function makeCover(companyName: string, address: string, HR: string, period: string) {
            let sulute = HR;
            if (HR.startsWith("Ms.") || HR.startsWith("Mr.")) {
                sulute = HR.substring(HR.indexOf(" ") + 1);
                sulute = sulute.substring(sulute.indexOf(" "));
                sulute = HR.substring(0, 3) + sulute;
            } else if (HR === "Hiring Manager") {
            }
            else {
                const url = "https://api.genderize.io/?name=" + HR.substring(0, HR.indexOf(" "));
                let M = "Ms.";
                await getGender(url).then(function (res) {
                    if (res !== null)
                        M = res;
                }).catch();
             //   console.log(M);
                sulute = M + HR.substring(HR.indexOf(" "));
            }
            let cmpN = companyName;
            if (companyName.endsWith(".")){
                cmpN = companyName.substring(0, companyName.indexOf("."));
            }

            const date = getDate();

            return date + "\n\n" + HR + "\n" + companyName + "\n" + address + "\n\n" + "Dear " + sulute + ":\n\n" + "\t\t\tRe: Application Software Developer Co-op Position\n\n" +
                "I am writing to express my keen interest in a " + period + " co-op position with " + cmpN + ". Your posting impressed me a lot because this position sets up different developing and testing works on a variety of " + companyName + " products. It combines my passion for technology with my skills as a team member. I believe my experience in software programming as well as my technical skills qualify me for this position.\n" +
                "\n" +
                "Being a programmer for the past two years, I have had the opportunity to work on projects involving test-driven development using Typescript, JUnit test, and programming using Java, and several course projects with C/C++. My most recent project “Insight UBC” is a course information querying machine which I implemented query engine based on EBNF. We start this project with TDD and developed with Node.js. We also use REST to implement Network communications. Besides, this project is tested using Karma and JUnit tests. Other than this project, My passion for programming and teaching myself new things have led me a member of the Microsoft Insider program and UBC ACM club. \n" +
                "\n" +
                "I have a strong willingness to learn. In the development of “Insight UBC”, I have learned a new programming language Typescript by myself and successively used it in our project. I am also currently learning Linux on Coursera to make myself more prepared for the future working environment. \n" +
                "\n" +
                "I am very excited to learn more about this opportunity and further share how my technical skills will be a great fit at " + cmpN + ". Thank you for taking the time to consider my application. I'm looking forward to hearing from you.\n" +
                "\n" +
                "Sincerely,\n" +
                "\n" +
                "Charlie Chen\n";
        }

        fs.readdir(folder, (err, files) => {
            files.forEach(function (file)
            {

                if(file.endsWith(".html")){
                    let cover = "";
                    fs.readFile(folder+file, "utf8", async function (err, data) {
                        const obj = new JSDOM(data);
                        const objDom = obj.window.document;
                        const companyName: string = findCompanyName(objDom);
                        const address: string = findCompanyAddress(objDom);
                        const HRName: string = findHRName(objDom);
                        const period: string = findPeriod(objDom);
                        cover = await makeCover(companyName, address, HRName, period);
                        fs.writeFile("./outpuTxt/" + file.substring(0, file.indexOf(".")) + ".txt", cover, function (err) {
                            if (err) {
                                console.log("failed: " + err);
                            }
                        });

                    });


                }
            });
        });
    }


}


