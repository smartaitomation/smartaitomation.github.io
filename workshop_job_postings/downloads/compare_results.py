"""Offline comparison. No model calls. Failure is positive.
Usage: python compare_results.py job-posting-workshop-reviews.json --split dev
Export contains samples? Supply --dataset job-postings-50.json (default).
"""
import argparse, json
from collections import defaultdict
from pathlib import Path

def compare(data, rows, split):
    samples={r['sample_id']:r for r in rows}
    latest={r['sample_id']:r['posting_sha256'] for r in rows}
    for v in data.get('versions',[]): latest[v['sample_id']]=v['posting_sha256']
    human={}
    for r in data['labels']:
        if r.get('status') in ('pass','fail'):human[(r['sample_id'],r['posting_sha256'],r['error_id'])]=r['status']
    judges={};invalid=0
    for j in data['judges']:
        if j.get('status') not in ('pass','fail') or not j.get('reason'):
            invalid+=1;continue
        judges[(j['sample_id'],j['posting_sha256'],j['error_id'],j['judge_version'])]=j
    groups=defaultdict(lambda:{'TP':0,'FP':0,'FN':0,'TN':0,'unpaired':0,'disagreements':[]})
    for (sid,sha,error,version),j in judges.items():
        if sid not in samples or (split!='all' and samples[sid]['split']!=split):continue
        if latest[sid]!=sha:continue
        g=groups[(error,version)];h=human.get((sid,sha,error))
        if h is None:g['unpaired']+=1;continue
        pred=j['status'];cell='TP' if h==pred=='fail' else 'TN' if h==pred=='pass' else 'FP' if pred=='fail' else 'FN'
        g[cell]+=1
        if h!=pred:g['disagreements'].append({'sample_id':sid,'human':h,'judge':pred,'reason':j['reason']})
    result=[]
    def ratio(a,b):return a/b if b else None
    for (error,version),g in groups.items():
        tp,fp,fn,tn=(g[k] for k in ('TP','FP','FN','TN'));n=tp+fp+fn+tn
        result.append({'error_id':error,'judge_version':version,'split':split,'paired':n,**g,'accuracy':ratio(tp+tn,n),'precision':ratio(tp,tp+fp),'recall':ratio(tp,tp+fn),'tnr':ratio(tn,tn+fp)})
    return {'groups':result,'invalid_results':invalid,'note':'No model run performed by this script. Null means undefined.'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('export');p.add_argument('--dataset',default='job-postings-50.json');p.add_argument('--split',choices=['train','dev','test','all'],default='dev');a=p.parse_args()
    print(json.dumps(compare(json.loads(Path(a.export).read_text()),json.loads(Path(a.dataset).read_text()),a.split),indent=2))
