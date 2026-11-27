"""Independent browser-to-source comparison for native-aspect static previews."""
import importlib.util
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("build_deck_art",ROOT/"scripts/build-deck-art.py")
source=importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)
RESULTS=ROOT/"test-results"
PROJECTS=("small","phone","landscape","desktop")
def compare(original,mask,path):
    actual=np.array(Image.open(path).convert("RGB"))
    h,w=actual.shape[:2]
    oh,ow=original.shape[:2]
    ratio_error=abs((w/h)/(ow/oh)-1)
    target=cv2.resize(original,(w,h),interpolation=cv2.INTER_AREA if w<ow else cv2.INTER_CUBIC)
    removed=cv2.resize(mask,(w,h),interpolation=cv2.INTER_NEAREST)>0
    # SSIM windows intersecting replaced question ink are excluded. The four
    # 20px CSS corner clips are also excluded; the visible frame is included.
    valid=cv2.dilate(removed.astype(np.uint8),np.ones((11,11),np.uint8))==0
    yy,xx=np.mgrid[:h,:w]
    radius=min(20,w/2,h/2)
    dx=np.maximum(radius-np.minimum(xx+.5,w-xx-.5),0)
    dy=np.maximum(radius-np.minimum(yy+.5,h-yy-.5),0)
    valid&=(dx*dx+dy*dy<=radius*radius)
    a=cv2.cvtColor(target,cv2.COLOR_RGB2GRAY).astype(np.float64)/255
    b=cv2.cvtColor(actual,cv2.COLOR_RGB2GRAY).astype(np.float64)/255
    blur=lambda x:cv2.GaussianBlur(x,(11,11),1.5)
    ma,mb=blur(a),blur(b);va=np.maximum(0,blur(a*a)-ma*ma);vb=np.maximum(0,blur(b*b)-mb*mb);cov=blur(a*b)-ma*mb
    ssim=((2*ma*mb+.01**2)*(2*cov+.03**2))/((ma*ma+mb*mb+.01**2)*(va+vb+.03**2))
    agreement=1-np.abs(target.astype(float)-actual.astype(float))[valid].mean()/255
    return {"ssim":round(float(ssim[valid].mean()),5),"rgbAgreement":round(float(agreement),5),"aspectError":round(ratio_error,5),"evaluatedFraction":round(float(valid.mean()),4),"size":[w,h]}

def main():
    report=[];issues=[]
    for family,rows in source.BOARDS.items():
        board=Image.open(ROOT/"design/reference-decks"/(family+".jpg")).convert("RGB").resize((1122,1402),Image.Resampling.LANCZOS)
        for level,(*crop,word) in enumerate(rows,1):
            original,_,mask=source.make(board,tuple(crop),word)
            key=f"{family}-{level}"
            for project in PROJECTS:
                paths=list(RESULTS.glob(f"reference-decks-all-sixtee*-{project}/{key}-art.png"))
                if len(paths)!=1:
                    issues.append(f"{project}/{key}: expected one actual browser capture, got {len(paths)}")
                    continue
                value=compare(original,mask,paths[0])
                report.append({"project":project,"card":key,**value})
                if value["aspectError"]>.025 or value["ssim"]<.95 or value["rgbAgreement"]<.95:
                    issues.append(f"{project}/{key}: {value}")
    RESULTS.mkdir(exist_ok=True)
    (RESULTS/"browser-source-comparison.json").write_text(json.dumps({"method":"masked static native-aspect SSIM + RGB agreement, independent original crop, excludes replaced word and clipped corners only","target":{"ssim":.95,"rgbAgreement":.95,"maxAspectError":.025},"count":len(report),"cards":report,"failures":issues},indent=2)+"\n")
    if report:
        print(f"Native browser reference review: {len(report)}/64 captures, min SSIM {min(v['ssim'] for v in report):.4f}, min RGB agreement {min(v['rgbAgreement'] for v in report):.4f}")
    for issue in issues: print(issue)
    if issues or len(report)!=64:raise SystemExit("Native visual reference gate failed")
if __name__=="__main__":main()
