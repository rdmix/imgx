import React, { useState, useEffect, useRef } from 'react';
import { checkWebpFeature, getImgGzip } from '../../utils';
// import { useIntersection } from '../utils/use-intersection';

const pattern = new RegExp('http(s)?://[^s]*');
const defaultImg = 'https://img.kaikeba.com/22857172219102bybu.jpeg';

const imglazyLoadInit = {
  filter: 'blur(20px)',
  opacity: 1,
};
const imglazyLoadLoaded = {
  filter: 'blur(0px)',
  opacity: 0,
  transition: 'filter ease 1',
  animationFillMode: 'both',
};

const ImgxHook = ({
  src = '', // 图片url
  delayTime = 1, // 动画持续时间
  isHttps = true, // 图片是否必须https
  imageLoadType = 'qiniu', // 低清晰图类型，默认qiniu七牛
  placeholderSrc = '', // 自定义低清晰url
  className,
  wrapperClassName,
  height,
  width,
  beforeLoad, // 加载后回调
  onClick, // 点击事件
  errorImgUrl, // 图片加载失败后，显示的图片
  alt,
  imgHitWidth, // 图片压缩宽度
  quality = 75, // 压缩质量
}) => {
  const imgRef = useRef(null);
  const blurTimer = useRef(null);
  // const [loaded, setLoaded] = useState(true);
  const [blurLayoutCss, setBlurLayoutCss] = useState({
    zIndex: 1,
  });
  const [loadedClassName, setLoadedClassName] = useState(imglazyLoadInit);
  const [imgLazyedDom, setImgLazyedDom] = useState(null);
  // const isLazy = true;
  // const [imgRef, isIntersected] = useIntersection({
  //   rootMargin: '200px',
  //   disabled: !isLazy,
  // });

  useEffect(() => {
    return () => {
      blurTimer.current = null;
    };
  }, []);

  useEffect(() => {
    loadedImg().then((imgElement) => {
      setImgLazyedDom(imgElement);
    });
  }, [src, placeholderSrc]);

  // 图片容错处理
  // useEffect(() => {
  //   setTimeout(() => {
  //     if (loaded) {
  //       setLoaded(false);
  //       onLoad();
  //     }
  //   }, 5000);
  // }, []);

  // 图片加载完
  const onLoad = () => {
    const time = delayTime ?? 0.6;
    // setLoaded(true);
    setLoadedClassName({
      transitionDuration: `${time}s`,
      ...imglazyLoadLoaded,
    });
    beforeLoad?.(imgRef); // 回调

    // 动效remove
    blurTimer.current = setTimeout(() => {
      setBlurLayoutCss({
        zIndex: -1,
        display: 'none',
      });
    }, time * 1000);
  };

  // 占位符图片url
  const handlePlaceholderSrc = () => {
    let curSrc = src;
    if (isHttps) {
      curSrc = pattern.test(src) ? fillerPlaceholderSrc(src) : defaultImg;
    }
    // 占位低清晰图支持类型
    const newImgType = {
      qiniu: `${curSrc}?imageMogr2/thumbnail/100x100/blur/3x5`,
      oss: '',
      custom: placeholderSrc, // 用户自定义
    };
    return newImgType[imageLoadType] || '';
  };

  // 过滤缩略图参数
  const fillerPlaceholderSrc = (url) => {
    let newUrlStr = url;
    if (/\?(imageView2|imageMogr2)\//.test(newUrlStr)) {
      const reg = newUrlStr.match(/(?<u>.*)\?.*/);
      newUrlStr = reg?.groups?.u || newUrlStr;
    }
    return newUrlStr || '';
  };

  const addImgUrlWebp = (url, fixUrl = '') => {
    let newUrlStr = url;
    const isUrlFormat = /\/(format)\/(.*)/g.test(newUrlStr);
    // 转换格式容错处理
    if (!isUrlFormat) {
      const tailFixStr = /\/$/g.test(newUrlStr) ? '' : '/';
      newUrlStr += `${fixUrl}${tailFixStr}format/webp`;
    }
    return newUrlStr;
  };

  const loadedImg = async () => {
    const iswebp = await checkWebpFeature();
    const newUrlStr = getImgGzip({ src, width: imgHitWidth, quality, iswebp });

    // 兼容webp格式
    // if (/\?(imageView2|imageMogr2)\//.test(newUrlStr) && iswebp) {
    //   newUrlStr = addImgUrlWebp(newUrlStr);
    // } else if (iswebp) {
    //   newUrlStr = addImgUrlWebp(newUrlStr, '?imageMogr2');
    // }
    return (
      <img
        ref={imgRef}
        onLoad={onLoad}
        src={newUrlStr}
        onError={(e) => {
          if (errorImgUrl) {
            e.target.onerror = null;
            e.target.src = `${errorImgUrl}`;
          }
        }}
        alt={alt || ''}
        className={className || ''}
        style={
          className
            ? null
            : {
                width: '100%',
                height: '100%',
              }
        }
      />
    );
  };

  return (
    <div
      className={`${wrapperClassName || ''}`}
      style={{
        height,
        width,
        position: 'relative',
      }}
      onClick={onClick}
    >
      {imgLazyedDom}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundColor: 'transparent',
          ...loadedClassName,
          ...blurLayoutCss,
        }}
      >
        <img
          src={handlePlaceholderSrc()}
          style={{
            width: '100%',
            height: '100%',
          }}
          alt={alt || ''}
        />
      </div>
    </div>
  );
};

export default ImgxHook;