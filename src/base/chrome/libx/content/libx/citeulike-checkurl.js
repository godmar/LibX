/* This file was automatically generated by gback@top.cs.vt.edu on Mon Mar 17 14:33:48 EDT 2008. */

/*
 * citeulike.regexps contains all regexps that are postable.
 * citeulike.canpost(url, onsuccess [, onfailure]) calls 
 * the 'onsuccess' function if url can be posted.
 * If provided, it calls 'onfailure' when it cannot.
 *
 * Generated from plugin svn's driver.tcl.
 * The most up-to-date copy of this file is always hosted at
 * ....
 * Clients are expected to pull a copy of this file and check
 * for updates in regular, but not too frequent intervals.
 *
 * Godmar Back godmar@gmail.com, 2008
 */
/**
 * @namespace libx.citeulike
 *
 * Support for CiteULike
 */
libx.citeulike = (function(){

var citeulike = {
    regexps : new Array(),
    /* check 10 regexps every 50 ms until done */
    checkspercall : 10,
    timerperiod : 50,
    canpost : function (url, onsuccess, onfailure, startidx) {
        if (startidx === undefined)
            startidx = 0;

        var n = this.checkspercall;
        while (n-- > 0 && startidx < this.regexps.length) {
            if (url.match(this.regexps[startidx])) {
                onsuccess(url, this.regexps[startidx]);
                return;
            }

            startidx++;
        }
        if (startidx < this.regexps.length)
            setTimeout(function () { 
                citeulike.canpost(url, onsuccess, onfailure, startidx); 
            }, this.timerperiod);
        else
            if (onfailure)
                onfailure(url);
    }
}


        /* Legacy regexps, manually created from set of vestigial plugins. 
         * >>> Please update this code as plugins are moved from vestigial to
         * the open source/svn area. <<<
         */
    
citeulike.regexps.push(/http:\/\/[^\/]*portal.acm.org[^\/]*\/citation/);
citeulike.regexps.push(/www\.agu\.org\/pubs\/crossref\/([0-9.]+\/[^\/]+)\.shtml/);
citeulike.regexps.push(/amazon.([a-z.]+)\/(gp|exec)\/.*\/?(ASIN|-|product)\/([^\/]+)/);
citeulike.regexps.push(/amazon.([a-z.]+)\/[^\/]+\/(gp|dp)\/([0-9X]+)\//);
citeulike.regexps.push(/amazon.([a-z.]+)\/dp\/([^\/]+)/);
citeulike.regexps.push(/^http:\/\/(www.citeulike.org|wilt:8000)\/(user\/[^\/]+\/)?article\/(\d+)/);
citeulike.regexps.push(/http:\/\/[^\/]*www.ingentaconnect.com[^\/]*/);
citeulike.regexps.push(/^http:\/\/[^.]+.metapress.com[^\/]*\//);
citeulike.regexps.push(/plosbiology.org\/plosonline.*doi=/);
citeulike.regexps.push(/ncbi\.nlm\.nih\.gov/);
citeulike.regexps.push(/http:\/\/www\.hubmed\.org\/display\.cgi?/);
citeulike.regexps.push(/^info:pmid\/([0-9]+)$/);
citeulike.regexps.push(/pubmedcentral.(nih.)?gov.*pubmedid=(\d+)/);
citeulike.regexps.push(/pubmedcentral.(nih.)?gov.*artid=(\d+)/);
citeulike.regexps.push(/sciencemag.org.*\/(summary|full|abstract|reprint)\/([0-9]+)\/([0-9]+)\/([0-9a-z]+)/);

        /* End of legacy regexps */
    
citeulike.regexps.push(/^http:\/\/(?:(?:www\.)?aclweb\.org\/anthology(?:-new)?|acl\.ldc\.upenn\.edu|ucrel\.lancs\.ac\.uk\/acl|acl\.eldoc\.ub\.rug\.nl\/mirror|www\.cs\.mu\.oz\.au\/acl)\/[A-Z]\/[A-Z]\d{2}\/[A-Z]\d{2}-\d+(?:\.bib|\.pdf)?$/);
citeulike.regexps.push(/pubs.acs.org\/cgi-bin\/abstract.cgi/);
citeulike.regexps.push(/aip.org\/(getabs|vsearch|link)/);
citeulike.regexps.push(/(ams.allenpress.com\/perlserv\/\?request=(get-document|get-abstract))/);
citeulike.regexps.push(/http:\/\/arjournals.annualreviews.org/);
citeulike.regexps.push(/http:\/\/www.anthrosource.net\/doi\/(abs|pdf|pdfplus)\/10.1525\/(.*)/);
citeulike.regexps.push(/((arxiv\.org|xxx.soton.ac.uk|xxx.lanl.gov)\/(pdf|abs|format|ps)\/([^\/]+\/?[^\/?]+))|(front.math.ucdavis.edu\/([^\/]+\/?[^\/?]+))/);
citeulike.regexps.push(/blackwell-synergy.com/);
citeulike.regexps.push(/^(http:\/\/(www\.)?(biomedcentral|genomebiology).com\/[0-9.-]+\/)|(http:\/\/(www.aidsrestherapy.com|www.almob.org|www.ann-clinmicrob.com|www.annals-general-psychiatry.com|www.asir-journal.com|arthritis-research.com|www.anzhealthpolicy.com|www.behavioralandbrainfunctions.com|bjoc.beilstein-journals.org|www.biology-direct.com|www.biomagres.com|www.bio-diglib.com|www.biomedical-engineering-online.com|www.biomedcentral.com\/bmcnewsviews|breast-cancer-research.com|www.cancerci.com|www.cbmjournal.com|www.cardiab.com|www.cardiovascularultrasound.com|www.cellandchromosome.com|www.biosignaling.com|www.celldiv.com|www.cerebrospinalfluidresearch.com|www.cmjournal.org|www.chiroandosteo.com|www.clinicalmolecularallergy.com|www.cpementalhealth.com|www.comparative-hepatology.com|www.resource-allocation.com|www.coughjournal.com|ccforum.com|www.cytojournal.com|www.diagnosticpathology.org|www.dynamic-med.com|www.eebp.org|www.ete-online.com|www.ehjournal.net|www.epi-perspectives.com|www.filariajournal.com|www.frontiersinzoology.com|www.gvt-journal.com|genomebiology.com|www.geochemicaltransactions.com|www.globalizationandhealth.com|www.harmreductionjournal.com|www.head-face-med.com|www.hqlo.com|www.health-policy-systems.com|www.human-resources-health.com|www.immunityageing.com|www.immunome-research.com|www.implementationscience.com|www.internationalbreastfeedingjournal.com|www.equityhealthj.com|www.ijbnpa.org|www.ij-healthgeographics.com|www.issoonline.com|www.jautoimdis.com|jbiol.com|www.j-biomed-discovery.com|www.JBPPNI.com|www.carcinogenesis.com|www.cardiothoracicsurgery.org|www.jcircadianrhythms.com|www.ethnobiomed.com|www.jexpclinassistreprod.com|www.jibtherapies.com|www.journal-inflammation.com|www.jmolecularsignaling.com|www.jnanobiotechnology.com|www.jnrbm.com|www.jneuroengrehab.com|www.jneuroinflammation.com|www.occup-med.com|www.josr-online.com|www.translational-medicine.com|www.kinetoplastids.com|www.lipidworld.com|www.malariajournal.com|www.medimmunol.com|www.microbialcellfactories.com|www.molecular-cancer.com|www.molecularneurodegeneration.com|www.molecularpain.com|www.ndt-journal.com|www.nuclear-receptor.com|www.nutritionandmetabolism.com|www.nutritionj.com|www.OJRD.com\/home|www.om-pc.com|www.particleandfibretoxicology.com|www.peh-med.com|www.plantmethods.com|www.pophealthmetrics.com|www.proteomesci.com|www.ro-journal.com|www.rbej.com|www.reproductive-health-journal.com|respiratory-research.com|www.retrovirology.com|www.salinesystems.org|www.the-scientist.com|www.scoliosisjournal.com|www.substanceabusepolicy.com|www.ssbjournal.com|www.tbiomed.com|www.thrombosisjournal.com|www.trialsjournal.com|www.virologyj.com|www.wjes.org|www.wjso.com)\/content)/);
citeulike.regexps.push(/([^\/]+).bmjjournals.com\/cgi\/content\/([^\/]+)\/([0-9]+)\/([0-9]+)\/([0-9a-zA-Z-]+)/);
citeulike.regexps.push(/^http:\/\/citeseer[^\/]+(edu|unizh.ch|edu.sg)\/([^\/]+.html)$/);
citeulike.regexps.push(/eprint.iacr.org\/(?:\d{4}\/\d+|cgi-bin\/cite\.pl\?entry=\d{4}\/\d+)/);
citeulike.regexps.push(/http:\/\/([^\/]+)?journals.cambridge.org\//);
citeulike.regexps.push(/^http:\/\/dblp.uni-trier.de\/rec\/bibtex\//);
citeulike.regexps.push(/$ ^/);
citeulike.regexps.push(/http:\/\/www.editlib.org\//);
citeulike.regexps.push(/http:\/\/www.eric.ed.gov\//);
citeulike.regexps.push(/http:\/\/(www\.)?(aaasmember\.sciencemag\.org|aacrmeetingabstracts\.org|aacrmeetingabstracts\.org|aapgrandrounds\.aappublications\.org|aapnews\.aappublications\.org|cme\.aappublications\.org|aappublications\.org|aappolicy\.aappublications\.org|aappolicy\.aappublications\.org|aapgbull\.geoscienceworld\.org|stroke\.ahajournals\.org|aemj\.org|ap\.psychiatryonline\.org|ach\.sagepub\.com|cme\.amcancersoc\.org|asj\.sagepub\.com|arj\.sagepub\.com|alh\.sagepub\.com|adb\.sagepub\.com|aas\.sagepub\.com|aeq\.sagepub\.com|adr\.iadrjournals\.org|adh\.sagepub\.com|advan\.physiology\.org|advan\.physiology\.org|apt\.rcpsych\.org|aff\.sagepub\.com|afraf\.oxfordjournals\.org|ageing\.oxfordjournals\.org|agron\.scijournals\.org|cme\.ahajournals\.org|alcalc\.oxfordjournals\.org|alphamedpress\.org|aacrjournals\.org|aacnjournals\.org|aapg\.geoscienceworld\.org|abs\.sagepub\.com|diabetesjournals\.org|aer\.sagepub\.com|aer\.sagepub\.com|ahajournals\.org|aja\.sagepub\.com|aja\.asha\.org|amjbot\.org|ajcn\.org|ajcc\.aacnjournals\.org|ajevonline\.org|aje\.oxfordjournals\.org|aje\.sagepub\.com|ajgponline\.org|ajhp\.org|ajh\.sagepub\.com|ajl\.sagepub\.com|ajm\.sagepub\.com|jmh\.sagepub\.com|ajnr\.org|ajp\.amjpathol\.org|ajpcon\.physiology\.org|ajpcell\.physiology\.org|ajpendo\.physiology\.org|ajpgi\.physiology\.org|ajpheart\.physiology\.org|ajplung\.physiology\.org|ajpregu\.physiology\.org|ajprenal\.physiology\.org|ajplegacy\.physiology\.org|ajp\.psychiatryonline\.org|ajph\.org|ajrccm\.org|ajrcmb\.org|ajronline\.org|ajsonline\.org|ajslp\.asha\.org|ajs\.sagepub\.com|ajtmh\.org|aler\.oxfordjournals\.org|alh\.oxfordjournals\.org|als\.dukejournals\.org|americanliterature\.dukejournals\.org|pubs\.ama-assn\.org|ammin\.geoscienceworld\.org|apr\.sagepub\.com|journals\.psychiatryonline\.org|arp\.sagepub\.com|amjpathol\.org|journals\.asm\.org|aspenjournals\.org|ash-sap\.hematologylibrary\.org|americanspeech\.dukejournals\.org|cme\.anesthesia-analgesia\.org|anesthesia-analgesia\.org|ang\.sagepub\.com|anm\.sagepub\.com|aob\.oxfordjournals\.org|annclinlabsci\.org|annfammed\.org|annfammed\.org|annals\.org|cme\.annals\.org|annhyg\.oxfordjournals\.org|annonc\.oxfordjournals\.org|theannals\.com|annalssurgicaloncology\.org|ann\.sagepub\.com|annalsnyas\.org|ard\.bmj\.com|ats\.ctsnetjournals\.org|ant\.sagepub\.com|aac\.asm\.org|aem\.asm\.org|applij\.oxfordjournals\.org|amrx\.oxfordjournals\.org|amrx\.oxfordjournals\.org|apm\.sagepub\.com|physiology\.org|govdocs\.aquake\.org|ars\.sagepub\.com|archderm\.ama-assn\.org|adc\.bmj\.com|ep\.bmj\.com|fn\.bmj\.com|archfaci\.ama-assn\.org|archfami\.ama-assn\.org|archfami\.ama-assn\.org|archpsyc\.ama-assn\.org|archinte\.ama-assn\.org|archneur\.ama-assn\.org|archopht\.ama-assn\.org|archotol\.ama-assn\.org|archpedi\.ama-assn\.org|archsurg\.ama-assn\.org|afs\.sagepub\.com|atvb\.ahajournals\.org|ahh\.sagepub\.com|abstracts\.iovs\.org|abstracts\.iovs\.org|meeting\.jco\.org|abstracts\.hematologylibrary\.org|abstracts\.hematologylibrary\.org|asheducationbook\.hematologylibrary\.org|asheducationbook\.hematologylibrary\.org|ashimagebank\.hematologylibrary\.org|ashimagebank\.hematologylibrary\.org|apj\.sagepub\.com|asianannals\.ctsnetjournals\.org|ajc\.sagepub\.com|aspetjournals\.org|asm\.sagepub\.com|atsjournals\.org|aut\.sagepub\.com|bmo\.sagepub\.com|bcn\.sagepub\.com|beheco\.oxfordjournals\.org|bioinformatics\.oxfordjournals\.org|biolbull\.org|brn\.sagepub\.com|biolreprod\.org|biomet\.oxfordjournals\.org|biophysj\.org|meeting\.biophysj\.org|biostatistics\.oxfordjournals\.org|bloodjournal\.hematologylibrary\.org|bmj\.com|careerfocus\.bmj\.com|careerfocus\.bmj\.com|journals\.bmj\.com|bod\.sagepub\.com|bonekey-ibms\.org|bonekey-ibms\.org|boundary2\.dukejournals\.org|brain\.oxfordjournals\.org|brief-treatment\.oxfordjournals\.org|bib\.oxfordjournals\.org|bfgp\.oxfordjournals\.org|birjournals\.org|bjps\.oxfordjournals\.org|bjaesthetics\.oxfordjournals\.org|bja\.oxfordjournals\.org|bjc\.oxfordjournals\.org|bjo\.bmj\.com|bjp\.rcpsych\.org|bjr\.birjournals\.org|bjsw\.oxfordjournals\.org|bjsm\.bmj\.com|jvi\.sagepub\.com|bjr\.sagepub\.com|bmb\.oxfordjournals\.org|bvapublications\.com|bse\.sagepub\.com|bsgf\.geoscienceworld\.org|bcpg\.geoscienceworld\.org|bst\.sagepub\.com|blms\.oxfordjournals\.org|bssaonline\.org|bssa\.geoscienceworld\.org|bas\.sagepub\.com|bcq\.sagepub\.com|bir\.sagepub\.com|caonline\.amcancersoc\.org|caonline\.amcancersoc\.org|cje\.oxfordjournals\.org|camqtly\.oxfordjournals\.org|cameraobscura\.dukejournals\.org|cja-jca\.org|cjs\.sagepub\.com|cmaj\.ca|cmaj\.ca|canmin\.geoscienceworld\.org|cebp\.aacrjournals\.org|cancerres\.aacrjournals\.org|canreviews\.aacrjournals\.org|cmlj\.oxfordjournals\.org|carcin\.oxfordjournals\.org|cardiacsurgery\.ctsnetbooks\.org|lifescied\.org|lifescied\.org|cercor\.oxfordjournals\.org|cesifo\.oxfordjournals\.org|chemse\.oxfordjournals\.org|chestjournal\.org|meeting\.chestjournal\.org|clt\.sagepub\.com|cmx\.sagepub\.com|chd\.sagepub\.com|cin\.sagepub\.com|chr\.sagepub\.com|chinesejil\.oxfordjournals\.org|cjip\.oxfordjournals\.org|cjip\.oxfordjournals\.org|chi\.sagepub\.com|crd\.sagepub\.com|circ\.ahajournals\.org|circ\.ahajournals\.org|circres\.ahajournals\.org|claymin\.geoscienceworld\.org|ccm\.geoscienceworld\.org|cla\.sagepub\.com|cat\.sagepub\.com|cvi\.asm\.org|clincancerres\.aacrjournals\.org|ccs\.sagepub\.com|clinchem\.org|ccp\.sagepub\.com|clinical\.diabetesjournals\.org|clinical\.diabetesjournals\.org|cjasn\.asnjournals\.org|clinmed\.netprints\.org|clinmed\.netprints\.org|clinmedres\.org|clinmedres\.org|cmr\.asm\.org|cnr\.sagepub\.com|cpj\.sagepub\.com|cre\.sagepub\.com|ctj\.sagepub\.com|ctr\.sagepub\.com|commonknowledge\.dukejournals\.org|crx\.sagepub\.com|crw\.sagepub\.com|cdj\.oxfordjournals\.org|cas\.sagepub\.com|cps\.sagepub\.com|cssaame\.dukejournals\.org|cbr\.sagepub\.com|chp\.sagepub\.com|comjnl\.oxfordjournals\.org|cer\.sagepub\.com|ceaccp\.oxfordjournals\.org|cis\.sagepub\.com|cpe\.oxfordjournals\.org|con\.sagepub\.com|cac\.sagepub\.com|cqx\.sagepub\.com|tcp\.sagepub\.com|cad\.sagepub\.com|cmc\.sagepub\.com|crj\.sagepub\.com|cjb\.sagepub\.com|cjp\.sagepub\.com|cjr\.sagepub\.com|ccn\.aacnjournals\.org|crobm\.iadrjournals\.org|csp\.sagepub\.com|coa\.sagepub\.com|crop\.scijournals\.org|ccr\.sagepub\.com|cshprotocols\.org|cme\.ctsnetjournals\.org|ctsnetjournals\.org|cdy\.sagepub\.com|cgj\.sagepub\.com|cus\.sagepub\.com|csc\.sagepub\.com|cap\.sagepub\.com|csi\.sagepub\.com|cbi\.sagepub\.com|da\.journal\.informs\.org|dem\.sagepub\.com|dmfr\.birjournals\.org|dev\.biologists\.org|diabetes\.diabetesjournals\.org|care\.diabetesjournals\.org|tde\.sagepub\.com|spectrum\.diabetesjournals\.org|differences\.dukejournals\.org|dio\.sagepub\.com|dmphp\.org|dmphp\.org|dcm\.sagepub\.com|das\.sagepub\.com|dis\.sagepub\.com|dnaresearch\.oxfordjournals\.org|docnews\.diabetesjournals\.org|docnews\.diabetesjournals\.org|dmd\.aspetjournals\.org|dukejournals\.org|em\.oxfordjournals\.org|eep\.sagepub\.com|ecc\.sagepub\.com|eid\.sagepub\.com|edq\.sagepub\.com|econgeol\.geoscienceworld\.org|eus\.sagepub\.com|esj\.sagepub\.com|eaq\.sagepub\.com|epm\.sagepub\.com|epa\.sagepub\.com|epa\.sagepub\.com|ema\.sagepub\.com|epx\.sagepub\.com|edr\.sagepub\.com|edr\.sagepub\.com|ecl\.dukejournals\.org|eltj\.oxfordjournals\.org|emj\.bmj\.com|endojournals\.org|edrv\.endojournals\.org|erc\.endocrinology-journals\.org|endo\.endojournals\.org|ehr\.oxfordjournals\.org|es\.oxfordjournals\.org|eab\.sagepub\.com|eau\.sagepub\.com|eeg\.geoscienceworld\.org|eg\.geoscienceworld\.org|epirev\.oxfordjournals\.org|eshremonographs\.oxfordjournals\.org|eic\.oxfordjournals\.org|etn\.sagepub\.com|eth\.sagepub\.com|ethnohistory\.dukejournals\.org|ec\.asm\.org|eular\.bmj\.com|eular\.bmj\.com|europace\.oxfordjournals\.org|eurheartj\.oxfordjournals\.org|eurheartjsupp\.oxfordjournals\.org|ehq\.sagepub\.com|eja\.sagepub\.com|ejcts\.ctsnetjournals\.org|ejc\.sagepub\.com|euc\.sagepub\.com|ecs\.sagepub\.com|eje-online\.org|ejd\.sagepub\.com|ejil\.oxfordjournals\.org|ejt\.sagepub\.com|eurjmin\.geoscienceworld\.org|ejo\.oxfordjournals\.org|ept\.sagepub\.com|eurpub\.oxfordjournals\.org|est\.sagepub\.com|ejw\.sagepub\.com|epe\.sagepub\.com|erj\.ersjournals\.com|err\.ersjournals\.com|err\.ersjournals\.com|ersjournals\.com|erae\.oxfordjournals\.org|esr\.oxfordjournals\.org|eup\.sagepub\.com|eur\.sagepub\.com|evi\.sagepub\.com|ehp\.sagepub\.com|erx\.sagepub\.com|ecam\.oxfordjournals\.org|ebm\.bmj\.com|ebmh\.bmj\.com|ebn\.bmj\.com|ebmonline\.org|ep\.physoc\.org|emg\.geoscienceworld\.org|ext\.sagepub\.com|fcs\.sagepub\.com|tfj\.sagepub\.com|fampra\.oxfordjournals\.org|fasebj\.org|fap\.sagepub\.com|fcx\.sagepub\.com|fth\.sagepub\.com|fty\.sagepub\.com|fmx\.sagepub\.com|fla\.sagepub\.com|focus\.psychiatryonline\.org|fst\.sagepub\.com|forestry\.oxfordjournals\.org|fmls\.oxfordjournals\.org|frc\.sagepub\.com|fhs\.dukejournals\.org|fh\.oxfordjournals\.org|fs\.oxfordjournals\.org|fsb\.oxfordjournals\.org|gac\.sagepub\.com|gas\.sagepub\.com|gtd\.sagepub\.com|genesdev\.org|genestocellsonline\.org|genetics\.org|genome\.org|geea\.geoscienceworld\.org|geolmag\.geoscienceworld\.org|egsp\.lyellcollection\.org|egsp\.lyellcollection\.org|mem\.lyellcollection\.org|sp\.lyellcollection\.org|geology\.geoscienceworld\.org|geoscienceworld\.org|geosphere\.geoscienceworld\.org|ghj\.sagepub\.com|gerontologist\.gerontologyjournals\.org|gcq\.sagepub\.com|gbr\.sagepub\.com|gmc\.sagepub\.com|gsp\.sagepub\.com|glq\.dukejournals\.org|glycob\.oxfordjournals\.org|gft\.sagepub\.com|gom\.sagepub\.com|gaq\.sagepub\.com|gpi\.sagepub\.com|bulletin\.geoscienceworld\.org|gsa\.geoscienceworld\.org|gsl\.geoscienceworld\.org|gut\.bmj\.com|hij\.sagepub\.com|content\.healthaffairs\.org|heb\.sagepub\.com|hej\.sagepub\.com|her\.oxfordjournals\.org|jhi\.sagepub\.com|heapol\.oxfordjournals\.org|heapro\.oxfordjournals\.org|hpp\.sagepub\.com|hea\.sagepub\.com|heart\.bmj\.com|hip\.sagepub\.com|hahr\.dukejournals\.org|hjb\.sagepub\.com|hope\.dukejournals\.org|hpy\.sagepub\.com|hhs\.sagepub\.com|hwj\.oxfordjournals\.org|hgs\.oxfordjournals\.org|hol\.sagepub\.com|hhc\.sagepub\.com|hsx\.sagepub\.com|hortsci\.ashspublications\.org|horttech\.ashspublications\.org|het\.sagepub\.com|hmg\.oxfordjournals\.org|hum\.sagepub\.com|humrep\.oxfordjournals\.org|humupd\.oxfordjournals\.org|hrd\.sagepub\.com|hrlr\.oxfordjournals\.org|hyper\.ahajournals\.org|hyper\.ahajournals\.org|icesjms\.oxfordjournals\.org|ietcom\.oxfordjournals\.org|ietele\.oxfordjournals\.org|ietfec\.oxfordjournals\.org|ietisy\.oxfordjournals\.org|ifl\.sagepub\.com|imamat\.oxfordjournals\.org|imaman\.oxfordjournals\.org|imamci\.oxfordjournals\.org|imajna\.oxfordjournals\.org|imaging\.birjournals\.org|imp\.sagepub\.com|inpractice\.bvapublications\.com|ier\.sagepub\.com|ijg\.sagepub\.com|ibe\.sagepub\.com|icc\.oxfordjournals\.org|ilj\.oxfordjournals\.org|iai\.asm\.org|idv\.sagepub\.com|isr\.journal\.informs\.org|joc\.journal\.informs\.org|injuryprevention\.bmj\.com|icb\.oxfordjournals\.org|ict\.sagepub\.com|icvts\.ctsnetjournals\.org|icvts\.ctsnetjournals\.org|interfaces\.journal\.informs\.org|iclq\.oxfordjournals\.org|gaz\.sagepub\.com|icj\.sagepub\.com|intimm\.oxfordjournals\.org|intqhc\.oxfordjournals\.org|jbd\.sagepub\.com|cos\.sagepub\.com|icon\.oxfordjournals\.org|ccm\.sagepub\.com|ics\.sagepub\.com|ijd\.sagepub\.com|ije\.oxfordjournals\.org|hpc\.sagepub\.com|ijlit\.oxfordjournals\.org|lawfam\.oxfordjournals\.org|ijl\.oxfordjournals\.org|ijl\.sagepub\.com|ijm\.sagepub\.com|ijo\.sagepub\.com|ijpor\.oxfordjournals\.org|ijrl\.oxfordjournals\.org|ijr\.sagepub\.com|irm\.sagepub\.com|isp\.sagepub\.com|ijs\.sagepub\.com|ijs\.sgmjournals\.org|ijtj\.oxfordjournals\.org|imrn\.oxfordjournals\.org|imrn\.oxfordjournals\.org|imrp\.oxfordjournals\.org|imrp\.oxfordjournals\.org|imrs\.oxfordjournals\.org|iab\.sagepub\.com|ips\.sagepub\.com|irx\.sagepub\.com|ire\.sagepub\.com|irap\.oxfordjournals\.org|irs\.sagepub\.com|ras\.sagepub\.com|isb\.sagepub\.com|isw\.sagepub\.com|iss\.sagepub\.com|isq\.sagepub\.com|iovs\.org|itq\.sagepub\.com|itnow\.oxfordjournals\.org|jama\.ama-assn\.org|cmejama-archives\.ama-assn\.org|JAMACareerNet\.ama-assn\.org|JAMACareerNet\.ama-assn\.org|jamafr\.ama-assn\.org|jaoa\.org|jaoa\.org|jjco\.oxfordjournals\.org|jnci\.oxfordjournals\.org|jncimono\.oxfordjournals\.org|jhj\.sagepub\.com|jnt\.sagepub\.com|jot\.sagepub\.com|jsp\.sagepub\.com|jar\.sagepub\.com|jae\.oxfordjournals\.org|jah\.sagepub\.com|andrologyjournal\.org|ast\.sagepub\.com|jas\.fass\.org|jac\.oxfordjournals\.org|jab\.sagepub\.com|jag\.sagepub\.com|jap\.physiology\.org|japr\.fass\.org|jas\.sagepub\.com|jad\.sagepub\.com|jb\.asm\.org|jbc\.sagepub\.com|jb\.oxfordjournals\.org|jbc\.org|jbr\.sagepub\.com|jba\.sagepub\.com|jbx\.sagepub\.com|jbt\.abrf\.org|jbt\.abrf\.org|jbp\.sagepub\.com|jbs\.sagepub\.com|jbjs\.org\.uk|proceedings\.jbjs\.org\.uk|proceedings\.jbjs\.org\.uk|journals\.jbjs\.org\.uk|ejbjs\.org|cme\.ejbjs\.org|www2\.ejbjs\.org|jen\.sagepub\.com|jbt\.sagepub\.com|job\.sagepub\.com|cpt\.sagepub\.com|jca\.sagepub\.com|jcd\.sagepub\.com|jel\.sagepub\.com|jcb\.org|jcs\.biologists\.org|cel\.sagepub\.com|chc\.sagepub\.com|jcn\.sagepub\.com|jcs\.sagepub\.com|jcem\.endojournals\.org|jci\.org|jci\.org|jcm\.asm\.org|jco\.ascopubs\.org|jcp\.bmj\.com|jcp\.sagepub\.com|jocn\.mitpress\.org|jcl\.sagepub\.com|jci\.sagepub\.com|jcle\.oxfordjournals\.org|jcm\.sagepub\.com|jcsl\.oxfordjournals\.org|jcr\.sagepub\.com|joc\.sagepub\.com|ccj\.sagepub\.com|jce\.sagepub\.com|jch\.sagepub\.com|jcx\.sagepub\.com|crc\.sagepub\.com|jcc\.sagepub\.com|jds\.fass\.org|jdsde\.oxfordjournals\.org|jdentaled\.org|jdr\.iadrjournals\.org|jdh\.oxfordjournals\.org|jds\.sagepub\.com|jdm\.sagepub\.com|jea\.sagepub\.com|ecl\.sagepub\.com|ecr\.sagepub\.com|joeg\.oxfordjournals\.org|jeb\.sagepub\.com|jeb\.sagepub\.com|jep\.sagepub\.com|jmicro\.oxfordjournals\.org|emf\.sagepub\.com|joe\.endocrinology-journals\.org|ini\.sagepub\.com|eng\.sagepub\.com|joe\.sagepub\.com|jed\.sagepub\.com|jeeg\.geoscienceworld\.org|jel\.oxfordjournals\.org|jeq\.scijournals\.org|jech\.bmj\.com|esp\.sagepub\.com|jes\.sagepub\.com|jeb\.biologists\.org|jxb\.oxfordjournals\.org|jem\.org|jfh\.sagepub\.com|jfi\.sagepub\.com|jfn\.sagepub\.com|jfec\.oxfordjournals\.org|jfe\.sagepub\.com|jfs\.sagepub\.com|jfr\.geoscienceworld\.org|jgp\.org|vir\.sgmjournals\.org|jgp\.sagepub\.com|jhm\.sagepub\.com|jhppl\.dukejournals\.org|hpq\.sagepub\.com|jhered\.oxfordjournals\.org|jhh\.sagepub\.com|jhc\.org|jhn\.sagepub\.com|jht\.sagepub\.com|jhl\.sagepub\.com|jhv\.sagepub\.com|jhp\.sagepub\.com|jimmunol\.org|jir\.sagepub\.com|jit\.sagepub\.com|jis\.sagepub\.com|jid\.sagepub\.com|jiplp\.oxfordjournals\.org|jim\.sagepub\.com|jic\.sagepub\.com|jicj\.oxfordjournals\.org|jiel\.oxfordjournals\.org|jiv\.sagepub\.com|jis\.oxfordjournals\.org|jls\.sagepub\.com|jlme\.org|jleo\.oxfordjournals\.org|jleukbio\.org|lis\.sagepub\.com|jlr\.org|logcom\.oxfordjournals\.org|jmk\.sagepub\.com|jom\.sagepub\.com|jme\.sagepub\.com|jmi\.sagepub\.com|jmd\.sagepub\.com|mcu\.sagepub\.com|jme\.bmj\.com|jmg\.bmj\.com|jmm\.sgmjournals\.org|jmems\.dukejournals\.org|mmr\.sagepub\.com|jmd\.amjpathol\.org|jme\.endocrinology-journals\.org|mollus\.oxfordjournals\.org|mpj\.sagepub\.com|jnnp\.bmj\.com|jn\.physiology\.org|neuro\.psychiatryonline\.org|jneurosci\.org|jnm\.snmjournals\.org|tech\.snmjournals\.org|jn\.nutrition\.org|opp\.sagepub\.com|jop\.ascopubs\.org|jorthod\.maneyjournals\.org|jpaleontol\.geoscienceworld\.org|jpr\.sagepub\.com|jpo\.sagepub\.com|jpepsy\.oxfordjournals\.org|jpt\.sagepub\.com|petrology\.oxfordjournals\.org|jpet\.aspetjournals\.org|jpp\.sagepub\.com|jp\.physoc\.org|plankt\.oxfordjournals\.org|jpe\.sagepub\.com|jph\.sagepub\.com|jpl\.sagepub\.com|jpe\.oxfordjournals\.org|jpe\.oxfordjournals\.org|jpf\.sagepub\.com|jpa\.sagepub\.com|jop\.sagepub\.com|jpart\.oxfordjournals\.org|jpubhealth\.oxfordjournals\.org|jrs\.oxfordjournals\.org|jrp\.sagepub\.com|jrc\.sagepub\.com|jri\.sagepub\.com|jrn\.sagepub\.com|jsm\.sagepub\.com|jsedres\.sepmonline\.org|jsedres\.geoscienceworld\.org|jos\.oxfordjournals\.org|jss\.oxfordjournals\.org|jsr\.sagepub\.com|spr\.sagepub\.com|jsa\.sagepub\.com|jsw\.sagepub\.com|jos\.sagepub\.com|sad\.sagepub\.com|jshd\.asha\.org|jslhr\.asha\.org|jss\.sagepub\.com|jse\.sagepub\.com|jsi\.sagepub\.com|jte\.sagepub\.com|jam\.sagepub\.com|jaaos\.org|jaapl\.org|jaapl\.org|jaar\.oxfordjournals\.org|jaaha\.org|jabfm\.org|jabfm\.org|content\.onlinejacc\.org|jacn\.org|jada\.ada\.org|jamia\.org|japmaonline\.org|jap\.sagepub\.com|journal\.ashspublications\.org|jasn\.asnjournals\.org|jgs\.geoscienceworld\.org|jgs\.lyellcollection\.org|jhc\.oxfordjournals\.org|jhmas\.oxfordjournals\.org|jicru\.oxfordjournals\.org|jia\.sagepub\.com|jlms\.oxfordjournals\.org|jrma\.oxfordjournals\.org|rsh\.sagepub\.com|jrsm\.org|jts\.oxfordjournals\.org|jtp\.sagepub\.com|jtc\.sagepub\.com|jtcs\.ctsnetjournals\.org|tcn\.sagepub\.com|jtd\.sagepub\.com|jtr\.sagepub\.com|tropej\.oxfordjournals\.org|jultrasoundmed\.org|juh\.sagepub\.com|jvm\.sagepub\.com|jvir\.org|jvdi\.org|jvmeonline\.org|jvc\.sagepub\.com|jvi\.asm\.org|vcu\.sagepub\.com|jwb\.sagepub\.com|jwildlifedis\.org|jwatch\.org|aids-clinical-care\.jwatch\.org|cardiology\.jwatch\.org|dermatology\.jwatch\.org|emergency-medicine\.jwatch\.org|gastroenterology\.jwatch\.org|general-medicine\.jwatch\.org|infectious-diseases\.jwatch\.org|neurology\.jwatch\.org|oncology-hematology\.jwatch\.org|cme\.jwatch\.org|pediatrics\.jwatch\.org|psychiatry\.jwatch\.org|womens-health\.jwatch\.org|jou\.sagepub\.com|biomed\.gerontologyjournals\.org|psychsoc\.gerontologyjournals\.org|maneyjournals\.org|biologists\.org|journals\.fass\.org|gerontologyjournals\.org|iadrjournals\.org|rcpsych\.org|snmjournals\.org|jpen\.aspenjournals\.org|lsj\.sagepub\.com|labor\.dukejournals\.org|lal\.sagepub\.com|lshss\.asha\.org|ltr\.sagepub\.com|ltj\.sagepub\.com|lap\.sagepub\.com|lch\.sagepub\.com|lpr\.oxfordjournals\.org|lea\.sagepub\.com|tle\.geoscienceworld\.org|learnmem\.org|library\.oxfordjournals\.org|lrt\.sagepub\.com|llc\.oxfordjournals\.org|litimag\.oxfordjournals\.org|litthe\.oxfordjournals\.org|jigpal\.oxfordjournals\.org|lup\.sagepub\.com|moh\.sagepub\.com|mcq\.sagepub\.com|mie\.sagepub\.com|mlq\.sagepub\.com|mansci\.journal\.informs\.org|msom\.journal\.informs\.org|mktsci\.journal\.informs\.org|mtq\.sagepub\.com|imammb\.oxfordjournals\.org|mms\.sagepub\.com|mor\.journal\.informs\.org|mcs\.sagepub\.com|mcr\.sagepub\.com|mdm\.sagepub\.com|mh\.bmj\.com|medlaw\.oxfordjournals\.org|mhj\.sagepub\.com|mq\.dukejournals\.org|jmm\.sagepub\.com|mic\.sgmjournals\.org|mmbr\.asm\.org|micropal\.geoscienceworld\.org|mind\.oxfordjournals\.org|minmag\.geoscienceworld\.org|mitpress\.org|mcx\.sagepub\.com|mj\.oxfordjournals\.org|mlq\.dukejournals\.org|mcb\.asm\.org|mcponline\.org|mbe\.oxfordjournals\.org|molbiolcell\.org|mcr\.aacrjournals\.org|mct\.aacrjournals\.org|mend\.endojournals\.org|molehr\.oxfordjournals\.org|molinterv\.aspetjournals\.org|mp\.bmj\.com|molpharm\.aspetjournals\.org|mplant\.oxfordjournals\.org|mplant\.oxfordjournals\.org|msa\.geoscienceworld\.org|msgbi\.geoscienceworld\.org|mmcts\.ctsnetjournals\.org|mmcts\.ctsnetjournals\.org|msj\.sagepub\.com|ml\.oxfordjournals\.org|mq\.oxfordjournals\.org|mutage\.oxfordjournals\.org|mycologia\.org|bul\.sagepub\.com|ner\.sagepub\.com|ncp\.aspenjournals\.org|cme\.nejm\.org|image-challenge\.nejm\.org|neoreviews\.aappublications\.org|ndt\.oxfordjournals\.org|neco\.mitpress\.org|neuro-oncology\.dukejournals\.org|neurology\.org|cme\.neurology\.org|nnr\.sagepub\.com|nro\.sagepub\.com|content\.nejm\.org|ngc\.dukejournals\.org|nms\.sagepub\.com|nvs\.sagepub\.com|nq\.oxfordjournals\.org|nar\.oxfordjournals\.org|nar\.oxfordjournals\.org|nass\.oxfordjournals\.org|nass\.oxfordjournals\.org|nej\.sagepub\.com|nsq\.sagepub\.com|obesityresearch\.org|onlinetog\.org|greenjournal\.org|oem\.bmj\.com|occmed\.oxfordjournals\.org|theoncologist\.alphamedpress\.org|theoncologist\.alphamedpress\.org|cme\.alphamedpress\.org|oq\.oxfordjournals\.org|or\.journal\.informs\.org|org\.sagepub\.com|oae\.sagepub\.com|orgsci\.journal\.informs\.org|oss\.sagepub\.com|orm\.sagepub\.com|cme\.oxfordjournals\.org|oaj\.oxfordjournals\.org|oep\.oxfordjournals\.org|dictionary\.oed\.com|ojls\.oxfordjournals\.org|oxrep\.oxfordjournals\.org|services\.oxfordjournals\.org|palaios\.geoscienceworld\.org|palaios\.sepmonline\.org|paleobiol\.geoscienceworld\.org|palsoc\.geoscienceworld\.org|pmj\.sagepub\.com|palynology\.geoscienceworld\.org|pa\.oxfordjournals\.org|ppq\.sagepub\.com|past\.oxfordjournals\.org|pedagogy\.dukejournals\.org|pediatrics\.aappublications\.org|pedsinreview\.aappublications\.org|prf\.sagepub\.com|pdiconnect\.com|psp\.sagepub\.com|psr\.sagepub\.com|pvs\.sagepub\.com|pharmrev\.aspetjournals\.org|philmat\.oxfordjournals\.org|philreview\.dukejournals\.org|psc\.sagepub\.com|pos\.sagepub\.com|ptjournal\.org|physiciansfirstwatch\.org|physiciansfirstwatch\.org|physiolgenomics\.physiology\.org|physrev\.physiology\.org|journals\.physoc\.org|physiologyonline\.org|plt\.sagepub\.com|pcp\.oxfordjournals\.org|plantcell\.org|aspbjournals\.org|plantphysiol\.org|pnas\.org|poeticstoday\.dukejournals\.org|pqx\.sagepub\.com|policing\.oxfordjournals\.org|policing\.oxfordjournals\.org|ppn\.sagepub\.com|pan\.oxfordjournals\.org|prq\.sagepub\.com|ptx\.sagepub\.com|pas\.sagepub\.com|ppe\.sagepub\.com|positions\.dukejournals\.org|pmj\.bmj\.com|ps\.fass\.org|pn\.bmj\.com|tpj\.sagepub\.com|prb\.sagepub\.com|pats\.atsjournals\.org|pats\.atsjournals\.org|plms\.oxfordjournals\.org|pdj\.sagepub\.com|phg\.sagepub\.com|ppg\.sagepub\.com|peds\.oxfordjournals\.org|proteinscience\.org|pb\.rcpsych\.org|pn\.psychiatryonline\.org|pn\.psychiatryonline\.org|psychservices\.psychiatryonline\.org|cme\.psychiatryonline\.org|pds\.sagepub\.com|pom\.sagepub\.com|psychosomaticmedicine\.org|psy\.psychiatryonline\.org|publicculture\.dukejournals\.org|pfr\.sagepub\.com|poq\.oxfordjournals\.org|ppa\.sagepub\.com|pus\.sagepub\.com|pwm\.sagepub\.com|publius\.oxfordjournals\.org|pun\.sagepub\.com|qjmed\.oxfordjournals\.org|qhr\.sagepub\.com|qix\.sagepub\.com|qrj\.sagepub\.com|qsw\.sagepub\.com|qshc\.bmj\.com|qjegh\.lyellcollection\.org|qjegh\.geoscienceworld\.org|qjmath\.oxfordjournals\.org|qjmam\.oxfordjournals\.org|rac\.sagepub\.com|rpd\.oxfordjournals\.org|rhr\.dukejournals\.org|radiographics\.rsnajnls\.org|radiologictechnology\.org|radiology\.rsnajnls\.org|rss\.sagepub\.com|rphr\.endojournals\.org|rphr\.endojournals\.org|aapredbook\.aappublications\.org|rsq\.oxfordjournals\.org|rel\.sagepub\.com|reproduction-online\.org|rsx\.sagepub\.com|roa\.sagepub\.com|rsw\.sagepub\.com|rsm\.sagepub\.com|rrn\.sagepub\.com|rer\.sagepub\.com|rer\.sagepub\.com|res\.oxfordjournals\.org|reep\.oxfordjournals\.org|rof\.oxfordjournals\.org|rfs\.oxfordjournals\.org|rop\.sagepub\.com|rrp\.sagepub\.com|rre\.sagepub\.com|rre\.sagepub\.com|rimg\.geoscienceworld\.org|ror\.reproduction-online\.org|ror\.reproduction-online\.org|rheumatology\.oxfordjournals\.org|rnajournal\.org|rmg\.geoscienceworld\.org|rsnajnls\.org|online\.sagepub\.com|sra\.sagepub\.com|schizophreniabulletin\.oxfordjournals\.org|spi\.sagepub\.com|scijournals\.org|sciencemag\.org|scx\.sagepub\.com|sts\.sagepub\.com|sageke\.sciencemag\.org|stke\.sciencemag\.org|sth\.sagepub\.com|sciencenow\.sciencemag\.org|screen\.oxfordjournals\.org|slr\.sagepub\.com|sdi\.sagepub\.com|scv\.sagepub\.com|sepmonline\.org|sexualities\.sagepub\.com|sti\.bmj\.com|svd\.sagepub\.com|sim\.sagepub\.com|sag\.sagepub\.com|sgr\.sagepub\.com|sls\.sagepub\.com|scan\.oxfordjournals\.org|scp\.sagepub\.com|shm\.oxfordjournals\.org|sp\.oxfordjournals\.org|ssc\.sagepub\.com|ssh\.dukejournals\.org|ssi\.sagepub\.com|ssjj\.oxfordjournals\.org|sss\.sagepub\.com|socialtext\.dukejournals\.org|endocrinology-journals\.org|sgmjournals\.org|jnumedmtg\.snmjournals\.org|jnumedmtg\.snmjournals\.org|ser\.oxfordjournals\.org|smr\.sagepub\.com|soc\.sagepub\.com|soil\.scijournals\.org|sajg\.geoscienceworld\.org|sae\.sagepub\.com|sar\.sagepub\.com|sas\.sagepub\.com|saq\.dukejournals\.org|sac\.sagepub\.com|smm\.sagepub\.com|smj\.sagepub\.com|slr\.oxfordjournals\.org|stemcells\.alphamedpress\.org|soq\.sagepub\.com|stroke\.ahajournals\.org|shm\.sagepub\.com|sce\.sagepub\.com|sih\.sagepub\.com|studiesinmycology\.org|studiesinmycology\.org|sri\.sagepub\.com|teamat\.oxfordjournals\.org|tvn\.sagepub\.com|trj\.sagepub\.com|theater\.dukejournals\.org|tse\.sagepub\.com|tcr\.sagepub\.com|tap\.sagepub\.com|tre\.sagepub\.com|tcs\.sagepub\.com|the\.sagepub\.com|thorax\.bmj\.com|tas\.sagepub\.com|tobaccocontrol\.bmj\.com|tou\.sagepub\.com|toxsci\.oxfordjournals\.org|tih\.sagepub\.com|tim\.sagepub\.com|tps\.sagepub\.com|transci\.journal\.informs\.org|tra\.sagepub\.com|tva\.sagepub\.com|tmt\.sagepub\.com|tia\.sagepub\.com|tandt\.oxfordjournals\.org|tcbh\.oxfordjournals\.org|uar\.sagepub\.com|uex\.sagepub\.com|vzj\.scijournals\.org|vzj\.geoscienceworld\.org|ves\.sagepub\.com|vmj\.sagepub\.com|vetpathology\.org|veterinaryrecord\.bvapublications\.com|vjortho\.com|vaw\.sagepub\.com|vcj\.sagepub\.com|wih\.sagepub\.com|wmr\.sagepub\.com|wjn\.sagepub\.com|wox\.sagepub\.com|wes\.sagepub\.com|wber\.oxfordjournals\.org|wbro\.oxfordjournals\.org|wcx\.sagepub\.com|ywcct\.oxfordjournals\.org|ywes\.oxfordjournals\.org|you\.sagepub\.com|yas\.sagepub\.com|yjj\.sagepub\.com|yvj\.sagepub\.com|)\/cgi(\/|\/content\/)(abstract|short|long|extract|full|refs|reprint|screenpdf|summary|eletters)[A-Za-z0-9.-\/;]+/);
citeulike.regexps.push(/ieeexplore.ieee.org/);
citeulike.regexps.push(/www.informaworld.com/);
citeulike.regexps.push(/^http:\/\/www.ingentaconnect.com[^\/]*\/.+$/);
citeulike.regexps.push(/iop.org[^\/]*\/EJ\/abstract\//);
citeulike.regexps.push(/(scripts.iucr.org\/cgi-bin\/paper?([0-9a-zA-Z]+))|(dx.doi.org\/10.1107\/[0-9a-zA-Z]+)/);
citeulike.regexps.push(/iwaponline.com\/([^\/]+)\/([0-9]{3,3})\/\1\2[0-9]{4,4}\.htm/);
citeulike.regexps.push(/^http:\/\/jmlr\.csail\.mit\.edu\/papers\/v\d+\/\w+\.(?:html|pdf|ps|ps\.gz)$/);
citeulike.regexps.push(/(jstor.org[^\/]*\/(browse|view|cgi-bin\/jstor\/viewitem)\/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+))|(links.jstor.org\/sici)/);
citeulike.regexps.push(/http:\/\/www.isrl.uiuc.edu\/~?amag\/langev\/paper\/(.*)/);
citeulike.regexps.push(/liebertonline.com/);
citeulike.regexps.push(/http:\/\/www.ams.org\/(msnmain|mathsci)/);
citeulike.regexps.push(/^http:\/\/(adsabs.harvard.edu|ukads.nottingham.ac.uk|cdsads.u-strasbg.fr|esoads.eso.org|ads.nao.ac.jp|ads.astro.puc.cl|ads.bao.ac.cn|ads.iucaa.ernet.in|ads.inasan.rssi.ru|ads.on.br|ads.kasi.re.kr|ads.grangenet.net|www.ads.lipi.go.id|ads.mao.kiev.ua)\/(cgi-bin\/nph-bib_query\?|abs)/);
citeulike.regexps.push(/(www.nature.com\/cgi.*file=\/([^\/]+)\/journal\/v([0-9]+)\/n([0-9]+)\/([^\/]+)\/([^\/]+)(_[^.]+)?.(html|pdf|ris))|www.nature.com\/([^\/]+)\/journal\/v([0-9]+)\/n([0-9]+)\/[^\/]+\/([^\/._]+)/);
citeulike.regexps.push(/^http:\/\/(www|nber\d*)\.nber\.org\/papers\/[a-z0-9]+$/);
citeulike.regexps.push(/^(http:\/\/([A-Za-z0-9]+\.openrepository.com\/[A-Za-z0-9]+)\/handle)|(http:\/\/(www.e-space.mmu.ac.uk\/e-space|www.hirsla.lsh.is\/lsh|arrts.gtcni.org.uk\/gtcni)\/handle)/);
citeulike.regexps.push(/(osa.org|opticsinfobase.org|opticsexpress.org)\/abstract.cfm/);
citeulike.regexps.push(/(http:\/\/[a-z]+.plosjournals.org\/perlserv.{0,5}request=get-document.doi=\S+)/);
citeulike.regexps.push(/http:\/\/muse.jhu.edu[^\/]*\/journals\/([^\/]+)\/v([0-9]+)\/([0-9]+).([0-9]+)([^.]+).html/);
citeulike.regexps.push(/prola.aps.org\/abstract|cornell.mirror.aps.org\/abstract|prola.ridge.aps.org|prola.library.cornell.edu\/abstract/);
citeulike.regexps.push(/http:\/\/psycontent.metapress.com\//);
citeulike.regexps.push(/$ ^/);
citeulike.regexps.push(/http:\/\/[^\/]*journals.royalsoc.ac.uk[^\/]*\/content|http:\/\/journals.royalsociety.org\/content/);
citeulike.regexps.push(/http:\/\/[^\/]*sciencedirect.com[^\/]*\/science(\?_ob|\/article)/);
citeulike.regexps.push(/scopus.com/);
citeulike.regexps.push(/(http:\/\/(www.)?springerlink(\.metapress)?\.com([^\/]*)\/(index\/.*|\(\w+\)\/app\/home\/contribution.*|content\/.*))/);
citeulike.regexps.push(/^http:\/\/papers\.ssrn\.com\/sol3\/papers.cfm\?abstract_id=[0-9]+$/);
citeulike.regexps.push(/^http:\/\/www\.usenix\.org\/(events\/|publications\/library\/proceedings\/)([^\/]+\/)*([a-z]+\.html)$/);
citeulike.regexps.push(/interscience.wiley.com\/cgi-bin\/abstract\/[0-9]*\/ABSTRACT/);

return citeulike;

})();
